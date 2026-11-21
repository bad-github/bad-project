import assert from 'node:assert/strict';
import {test} from 'vitest';
import {createTreeFormSchema, validateValue, type FieldValue, type ControlType} from './schema.ts';
import {
  appendChild,
  collectIds,
  controlTypes,
  createInitialTree,
  createNode,
  findNode,
  removeNode,
  serializeTree,
} from './tool.ts';

// 在应用目录运行：pnpm test schema.test.ts
// 覆盖值协议、递归路径与动态增删，避免只检查“工厂是否返回了自身定义的字段”。
test('所有控件都能接收有效值，并拒绝不匹配的值', () => {
  const valid: Record<(typeof controlTypes)[number], FieldValue> = {
    input: 'text',
    password: 'secret',
    number: 0,
    textarea: 'line',
    switch: false,
    checkbox: false,
    select: 'a',
    'multi-select': ['a', 'c'],
    'native-select': 'b',
    'radio-group': 'c',
    'checkbox-group': ['a'],
    combobox: 'b',
    slider: 0,
    'range-slider': [0, 100],
    date: '2026-10-18',
    'date-range': {from: '2026-10-18', to: '2026-10-19'},
    'input-otp': '123456',
    toggle: false,
    'toggle-group': ['a', 'b'],
  };
  for (const type of controlTypes) {
    const {node} = createNode(type);
    assert.equal(validateValue(node, valid[type]), undefined, type);
    assert.ok(validateValue(node, {from: 'invalid', to: null}), type);
  }
});

test('边界校验：非法日期、半选范围、逆序范围、重复选项、超限数值与 OTP', () => {
  const cases: [ControlType, FieldValue][] = [
    ['date', '2026-02-30'],
    ['date-range', {from: '2026-10-18', to: null}],
    ['date-range', {from: '2026-10-19', to: '2026-10-18'}],
    ['range-slider', [80, 20]],
    ['multi-select', ['a', 'a']],
    ['select', 'not-an-option'],
    ['number', 101],
    ['input-otp', '12345x'],
  ];
  for (const [type, value] of cases) {
    assert.ok(validateValue(createNode(type).node, value));
  }
  const {node} = createNode('input');
  assert.ok(validateValue(node, '   '));
  assert.equal(validateValue({...node, rules: {required: false}}, ''), undefined);
});

test('嵌套节点错误绑定稳定 ID，删除前面的兄弟节点不改变剩余值归属', () => {
  const a = createNode('input');
  const b = createNode('select');
  const c = createNode('switch');
  const original = [{...a.node, children: [b.node, c.node]}];
  const values = {[a.node.id]: 'ok', [b.node.id]: null, [c.node.id]: false};
  const result = createTreeFormSchema(original).safeParse({values});
  assert.equal(result.success, false);
  if (!result.success) assert.deepEqual(result.error.issues[0]?.path, ['values', b.node.id]);
  const remaining = removeNode(original, b.node.id);
  assert.equal(original[0]!.children.length, 2, '原树不可被修改');
  assert.equal(remaining[0]!.children?.[0]?.id, c.node.id);
  assert.equal(createTreeFormSchema(remaining).safeParse({values}).success, true);
  assert.equal(serializeTree(remaining, values)[0]!.children?.[0]?.inputValue, false);
});

test('增删子树保持其他分支，收集删除 ID 包含所有后代', () => {
  const root = createNode('input').node;
  const child = createNode('checkbox').node;
  const sibling = createNode('slider').node;
  const nested = appendChild([root, sibling], root.id, child);
  assert.equal(root.children, undefined);
  assert.deepEqual(collectIds(nested[0]!), [root.id, child.id]);
  assert.equal(findNode(nested, child.id)?.id, child.id);
  assert.deepEqual(removeNode(nested, root.id), [sibling]);
});

test('初始化覆盖整个控件目录，配置可以安全序列化', () => {
  const {nodes, form} = createInitialTree();
  const all = nodes.flatMap(collectIds);
  assert.equal(all.length, controlTypes.length);
  assert.equal(new Set(all).size, all.length);
  // 默认值必须能通过真实的整树校验，避免控件看似有值却无法直接提交。
  assert.equal(createTreeFormSchema(nodes).safeParse(form).success, true);
  for (const type of controlTypes) {
    const {node, value} = createNode(type);
    assert.equal(validateValue(node, value), undefined, `新增 ${type} 的默认值应有效`);
  }
  const result = JSON.parse(JSON.stringify(serializeTree(nodes, form.values)));
  assert.equal(result[0].children.length, 2);
});
