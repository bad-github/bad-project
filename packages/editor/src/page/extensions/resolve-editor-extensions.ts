import {flattenExtensions, getExtensionField, type AnyExtension, type Extensions} from '@tiptap/core';

export type EditorExtensionGroup = {
  // 使用案例名称标识来源，配置冲突时能直接定位到需要修改的模块。
  source: string;
  extensions: Extensions;
  // 仅基础集合（如 StarterKit）使用：同名扩展由案例的明确声明替代。
  // 删除案例后，基础集合中的默认扩展会自动恢复，无需手工修改关闭列表。
  fallback?: boolean;
};

// 不使用 JSON.stringify：函数、undefined 和非普通对象都可能是有效的扩展选项。
// 普通对象/数组递归比较；函数和类实例必须引用相同，无法确认相同就报告冲突。
function sameValue(left: unknown, right: unknown, visited = new WeakMap<object, object>()): boolean {
  if (Object.is(left, right)) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;
  const prototype = Object.getPrototypeOf(left);
  if (prototype !== Object.getPrototypeOf(right)) return false;
  if (!Array.isArray(left) && prototype !== Object.prototype && prototype !== null) return false;
  if (Array.isArray(left) && left.length !== (right as unknown[]).length) return false;
  if (visited.has(left)) return visited.get(left) === right;
  visited.set(left, right);
  const keys = Reflect.ownKeys(left);
  return keys.length === Reflect.ownKeys(right).length && keys.every((key) =>
    Object.prototype.hasOwnProperty.call(right, key) &&
    sameValue(Reflect.get(left, key), Reflect.get(right, key), visited)
  );
}

// configure() 会生成新的 addOptions 函数，因此不能直接比较整个 config 对象。
// options 单独比较；其余行为保留完整 parent 链，确保不同 NodeView/命令不会被误合并。
// 不能只比较最终覆盖后的字段：扩展方法可能通过 this.parent() 调用父级实现。
function getBehavior(extension: AnyExtension): Record<string, unknown>[] {
  const behavior = extension.parent ? getBehavior(extension.parent) : [];
  const config: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(extension.config)) {
    if (key !== 'addOptions' && value !== undefined) config[key] = value;
  }
  return [...behavior, config];
}

/**
 * 案例分别声明依赖，入口只负责组合：
 * 1. 展开 StarterKit/TableKit 等集合，检查其中的子扩展，而不只是顶层 name。
 * 2. 案例声明优先于 fallback 默认值，例如 Lowlight 替代默认 codeBlock。
 * 3. 同名且选项、行为相同的扩展只注册一次；其他冲突抛出带来源的错误。
 *
 * 不按数组顺序静默覆盖案例配置。开发和生产都拒绝冲突，避免发布后行为悄悄变化。
 */
export function resolveEditorExtensions(groups: EditorExtensionGroup[]): Extensions {
  const selected = new Map<string, {extension: AnyExtension; group: EditorExtensionGroup}>();

  for (const group of groups) {
    for (const extension of flattenExtensions(group.extensions)) {
      const previous = selected.get(extension.name);
      if (!previous) {
        selected.set(extension.name, {extension, group});
        continue;
      }
      if (previous.group.fallback && !group.fallback) {
        selected.set(extension.name, {extension, group});
        continue;
      }
      if (!previous.group.fallback && group.fallback) continue;
      if (previous.extension.type === extension.type &&
          sameValue(previous.extension.options, extension.options) &&
          sameValue(getBehavior(previous.extension), getBehavior(extension))) continue;

      throw new Error(
        `[Editor] 扩展 "${extension.name}" 配置冲突：` +
        `"${previous.group.source}" 与 "${group.source}"。请共用同一份扩展定义或统一配置。`
      );
    }
  }

  return [...selected.values()].map(({extension}) => {
    if (!getExtensionField(extension, 'addExtensions')) return extension;
    // 子扩展已经展开并去重，必须阻止 Tiptap 再次展开原集合，否则重复注册会重新出现。
    // 保留集合本身及其生命周期/存储等行为，仅将子扩展交给上面的统一注册结果。
    return extension.extend({addExtensions: () => []}) as AnyExtension;
  });
}
