import type {FieldErrors, Resolver} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {createTreeFormSchema, validateValue, type FormSchema, type TreeNode} from './schema.ts';

/** RHF 的 resolver options.names 在提交时只包含已注册字段，不能用数量判断是否整表提交。
 * 虚拟列表中尚未挂载的字段也必须校验，因此由页面显式声明本次是否执行全量校验。 */
export type ValidationContext = {validateAll: boolean};

export function createTreeResolver(nodes: TreeNode[]): Resolver<FormSchema, ValidationContext> {
  // 结构变化时才重建索引，输入一个字符不再递归寻找节点或遍历整棵树。
  const index = new Map<string, TreeNode>();
  const visit = (items: TreeNode[]) =>
    items.forEach((node) => {
      index.set(`values.${node.id}`, node);
      if (node.children) visit(node.children);
    });
  visit(nodes);
  const resolveAll = zodResolver(createTreeFormSchema(nodes));

  return (values, context, options) => {
    // RHF 删除最后一个字段时可能连空的 values 对象也移除；空树仍应能正常提交。
    const data = values.values ? values : {values: {}};
    if (context?.validateAll || !options.names?.length || options.names.includes('values')) {
      // 提交仍使用原有 Zod schema：检查值结构、所有节点及未挂载字段。
      return resolveAll(data, context, options);
    }
    const errors: FieldErrors<FormSchema> = {};
    for (const name of options.names) {
      const node = index.get(name);
      if (!node) continue; // 已删除的字段不再参与校验。
      const message = validateValue(node, data.values[node.id] ?? null);
      if (message) {
        errors.values ??= {};
        errors.values[node.id] = {type: 'validate', message};
      }
    }
    // 增量校验只返回本次字段的错误，RHF 按字段名更新，不会清掉其他字段的错误。
    return Object.keys(errors).length ? {values: {}, errors} : {values: data, errors: {}};
  };
}
