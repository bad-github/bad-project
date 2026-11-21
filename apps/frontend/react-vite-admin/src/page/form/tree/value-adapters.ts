import type {TreeNode} from './schema';

/** 类型收窄同时用于渲染分流，不能在同一个组件里条件调用 useController。 */
export function isUncontrolledType(type: TreeNode['control']['type']) {
  return (
    type === 'input' || type === 'password' || type === 'number' || type === 'textarea' || type === 'native-select'
  );
}

/** 数字字段不使用 valueAsNumber（清空后会产生 NaN）；也不能 Number('')，它会误变成 0。 */
export function parseNumberInput(value: unknown) {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
