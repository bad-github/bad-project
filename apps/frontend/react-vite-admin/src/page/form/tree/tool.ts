import type {ControlConfig, ControlType, FieldValue, FormSchema, TreeNode} from './schema';

// 表单字段使用简单递增键；不使用会随增删变化的 TanStack 行 ID。
// 保留非数字前缀，避免 React Hook Form 把 values.<数字> 解析为数组。
let nodeIdSequence = 0;

/** 唯一的控件目录：用于初始化覆盖、添加节点菜单和随机添加。 */
export const controlTypes = [
  'input',
  'password',
  'number',
  'textarea',
  'switch',
  'checkbox',
  'select',
  'multi-select',
  'native-select',
  'radio-group',
  'checkbox-group',
  'combobox',
  'slider',
  'range-slider',
  'date',
  'date-range',
  'input-otp',
  'toggle',
  'toggle-group',
] as const satisfies readonly ControlType[];

/** 工厂同时产生配置和有效默认值，初始化及动态新增都可直接参与提交。 */
export function createNode(type: ControlType): {node: TreeNode; value: FieldValue} {
  const options = ['a', 'b', 'c'].map((value) => ({label: `选项 ${value.toUpperCase()}`, value}));
  let control: ControlConfig;
  let value: FieldValue;
  switch (type) {
    case 'input':
    case 'password':
      control = {type, placeholder: '请输入'};
      value = type === 'password' ? 'Demo123456' : '默认文本';
      break;
    case 'number':
      control = {type, min: 0, max: 100, step: 1};
      value = 50;
      break;
    case 'textarea':
      control = {type, rows: 3};
      value = '第一行默认文本\n第二行默认文本';
      break;
    case 'switch':
    case 'checkbox':
    case 'toggle':
      control = {type};
      value = false;
      break;
    case 'slider':
    case 'range-slider':
      control = {type, min: 0, max: 100, step: 1};
      value = type === 'slider' ? 30 : [20, 80];
      break;
    case 'date':
    case 'date-range': {
      control = {type};
      // 使用本地日历日期；setDate 按天推进，可以正确跨月、跨年及跨夏令时。
      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      const format = (date: Date) =>
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      value = type === 'date' ? format(start) : {from: format(start), to: format(end)};
      break;
    }
    case 'input-otp':
      control = {type, length: 6};
      value = '123456';
      break;
    default:
      control = {type, options};
      // 多选默认选中 A、B，单选默认选中 A，值与 options 的 value 保持一致。
      value = ['multi-select', 'checkbox-group', 'toggle-group'].includes(type) ? ['a', 'b'] : 'a';
  }
  return {node: {id: `node_${++nodeIdSequence}`, label: type, control, rules: {required: true}}, value};
}

/** 每种控件至少出现一次，按每三个节点分为一组，兼顾控件覆盖和嵌套展示。 */
export function createInitialTree(): {nodes: TreeNode[]; form: FormSchema} {
  const nodes: TreeNode[] = [];
  const values: FormSchema['values'] = {};
  controlTypes.forEach((type, index) => {
    const item = createNode(type);
    values[item.node.id] = item.value;
    if (index % 3 === 0) nodes.push(item.node);
    else (nodes[nodes.length - 1]!.children ??= []).push(item.node);
  });
  return {nodes, form: {values}};
}

/** 只复制目标节点及其祖先；未变化的兄弟节点和数组保持引用，让 memo 可以跳过渲染。 */
export function appendChild(nodes: TreeNode[], parentId: string, child: TreeNode): TreeNode[] {
  let changed = false;
  const result = nodes.map((node) => {
    if (node.id === parentId) {
      changed = true;
      return {...node, children: [...(node.children ?? []), child]};
    }
    if (!node.children) return node;
    const children = appendChild(node.children, parentId, child);
    if (children === node.children) return node;
    changed = true;
    return {...node, children};
  });
  return changed ? result : nodes;
}

export function findNode(nodes: TreeNode[], id: string): TreeNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = node.children && findNode(node.children, id);
    if (found) return found;
  }
}

export function collectIds(node: TreeNode): string[] {
  return [node.id, ...(node.children ?? []).flatMap(collectIds)];
}

export function removeNode(nodes: TreeNode[], id: string): TreeNode[] {
  let changed = false;
  const result: TreeNode[] = [];
  for (const node of nodes) {
    if (node.id === id) {
      changed = true;
      continue;
    }
    const children = node.children && removeNode(node.children, id);
    if (children !== node.children) {
      changed = true;
      result.push({...node, children});
    } else result.push(node);
  }
  return changed ? result : nodes;
}

/** 提交时再组合配置与值；编辑过程不复制整棵树，JSON 结果也保留完整层级。 */
export type SubmittedNode = Omit<TreeNode, 'children'> & {inputValue: FieldValue; children?: SubmittedNode[]};
export function serializeTree(nodes: TreeNode[], values: FormSchema['values']): SubmittedNode[] {
  return nodes.map(({children, ...node}) => ({
    ...node,
    inputValue: values[node.id] ?? null,
    ...(children ? {children: serializeTree(children, values)} : {}),
  }));
}
