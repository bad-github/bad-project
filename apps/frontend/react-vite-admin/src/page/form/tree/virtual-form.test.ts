import assert from 'node:assert/strict';
import {test} from 'vitest';
import {createFormControl} from 'react-hook-form';
import {createTable, getCoreRowModel} from '@tanstack/react-table';
import {createTreeResolver, type ValidationContext} from './resolver.ts';
import {appendChild, createNode, removeNode, serializeTree} from './tool.ts';
import {parseNumberInput} from './value-adapters.ts';
import {createTreeFormSchema, type FormSchema, type TreeNode} from './schema.ts';

test('输入只校验指定字段，提交校验未挂载和折叠字段', async () => {
  const a = createNode('input');
  const b = createNode('number');
  const resolve = createTreeResolver([{...a.node, children: [b.node]}]);
  const values = {values: {[a.node.id]: 'ok', [b.node.id]: null}};
  // 模拟只有 A 曾挂载：提交仍必须发现 B 的错误，不能按 names.length 判断提交范围。
  const options = {names: [`values.${a.node.id}` as const], fields: {}, shouldUseNativeValidation: false};
  assert.deepEqual((await resolve(values, {validateAll: false}, options)).errors, {});
  const submitted = await resolve(values, {validateAll: true}, options);
  assert.ok(submitted.errors.values?.[b.node.id]?.message);
});

test('RHF 变更一个字段时保留另一个字段的错误，删除后不再校验原节点', async () => {
  const a = createNode('input');
  const b = createNode('input');
  const context: ValidationContext = {validateAll: true};
  const form = createFormControl<FormSchema, ValidationContext>({
    defaultValues: {values: {[a.node.id]: '', [b.node.id]: ''}},
    resolver: createTreeResolver([a.node, b.node]),
    context,
    shouldUnregister: false,
  });
  const unsubscribe = form.subscribe({formState: {errors: true}, callback: () => {}});
  form.register(`values.${a.node.id}`);
  form.register(`values.${b.node.id}`);
  assert.equal(await form.trigger(), false);
  context.validateAll = false;
  form.setValue(`values.${a.node.id}`, 'updated');
  assert.equal(await form.trigger(`values.${a.node.id}`), true);
  assert.equal(form.getFieldState(`values.${a.node.id}`).error, undefined);
  assert.ok(form.getFieldState(`values.${b.node.id}`).error);
  const remaining = createTreeResolver([a.node]);
  assert.deepEqual(
    (await remaining(form.getValues(), {validateAll: true}, {fields: {}, shouldUseNativeValidation: false})).errors,
    {}
  );
  unsubscribe();
});

test('非受控字段重新注册恢复最新值，数字清空保持 null，删除清理值和错误', async () => {
  const node = createNode('number').node;
  const name = `values.${node.id}` as const;
  const form = createFormControl<FormSchema>({defaultValues: {values: {[node.id]: 50}}, shouldUnregister: false});
  const unsubscribe = form.subscribe({formState: {values: true}, callback: () => {}});
  // 用 DOM input 的最小接口验证 RHF ref 挂载协议，不依赖虚拟表格私有实现。
  const first = {type: 'number', name, value: '', isConnected: true};
  const registration = form.register(name, {setValueAs: parseNumberInput});
  registration.ref(first);
  assert.equal(Number(first.value), 50);
  first.value = '73';
  await registration.onChange({target: first, type: 'change'});
  assert.equal(form.getValues(name), 73);
  registration.ref(null); // 模拟滚出视口：卸载，但不 unregister。
  const second = {type: 'number', name, value: '', isConnected: true};
  const remounted = form.register(name, {setValueAs: parseNumberInput});
  remounted.ref(second);
  assert.equal(Number(second.value), 73);
  second.value = '';
  await remounted.onChange({target: second, type: 'change'});
  assert.equal(form.getValues(name), null);
  form.setError(name, {type: 'validate', message: '必填'});
  form.unregister(name); // 真正删除，与虚拟卸载不同。
  assert.equal(form.getValues(name), undefined);
  assert.equal(form.getFieldState(name).error, undefined);
  const empty = await createTreeResolver([])(
    form.getValues(),
    {validateAll: true},
    {
      fields: {},
      shouldUseNativeValidation: false,
    }
  );
  assert.deepEqual(empty.errors, {});
  assert.deepEqual(empty.values, {values: {}});
  unsubscribe();
});

test('树操作保持未修改分支引用，没有命中时直接返回原数组', () => {
  const root = createNode('input').node;
  const child = createNode('switch').node;
  const sibling = {...createNode('input').node, children: [createNode('number').node]};
  const tree = [root, sibling];
  const added = appendChild(tree, root.id, child);
  assert.equal(added[1], sibling);
  assert.equal(added[1]?.children, sibling.children);
  assert.equal(appendChild(tree, 'missing-id', child), tree);
  assert.equal(removeNode(tree, 'missing-id'), tree);
  assert.equal(removeNode(added, child.id)[1], sibling);
});

test('数字转换区分空值与 0，不保存 NaN', () => {
  assert.equal(parseNumberInput(''), null);
  assert.equal(parseNumberInput('0'), 0);
  assert.equal(parseNumberInput('1.5'), 1.5);
  assert.equal(parseNumberInput('invalid'), null);
});

test('TanStack 自动生成唯一行 ID，删除兄弟节点重新编号后保留值和错误归属', () => {
  const root = createNode('input');
  const first = createNode('input');
  const second = createNode('input');
  const sibling = createNode('input');
  const nodes = [{...root.node, children: [first.node, second.node]}, sibling.node];
  const table = createTable<TreeNode>({
    data: nodes,
    columns: [],
    state: {},
    onStateChange: () => {},
    renderFallbackValue: null,
    getSubRows: (node) => node.children,
    getCoreRowModel: getCoreRowModel(),
  });
  const initial = table.getCoreRowModel().flatRows;
  assert.deepEqual(
    initial.map((row) => row.id),
    ['0', '0.0', '0.1', '1']
  );
  assert.equal(new Set(initial.map((row) => row.id)).size, initial.length);

  const remaining = removeNode(nodes, first.node.id);
  table.setOptions((options) => ({...options, data: remaining}));
  const rows = table.getCoreRowModel().flatRows;
  assert.equal(rows[1]?.id, '0.0');
  assert.equal(rows[1]?.original.id, second.node.id);
  const values = {
    [root.node.id]: root.value,
    [second.node.id]: '',
    [sibling.node.id]: '保留的输入',
  };
  const serialized = serializeTree(remaining, values);
  assert.equal(serialized[0]?.children?.[0]?.inputValue, '');
  assert.equal(serialized[1]?.inputValue, '保留的输入');
  const result = createTreeFormSchema(remaining).safeParse({values});
  assert.equal(result.success, false);
  if (!result.success) assert.deepEqual(result.error.issues[0]?.path, ['values', second.node.id]);
});
