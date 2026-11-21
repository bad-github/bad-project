import type {i18n} from 'i18next';
import type {LocaleLoadKey} from './types';

/** 复制资源树，避免初始化后的修改污染其他实例或原始资源。 */
export function cloneResource<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item: unknown) => cloneResource(item)) as T;
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneResource(item)])) as T;
  }
  return value;
}

const pendingLoads = new WeakMap<i18n, Map<LocaleLoadKey, Promise<void>>>();

/** 仅合并同一实例的在途任务；成功和失败后都清理，允许失败重试。 */
export function loadOnce(instance: i18n, key: LocaleLoadKey, task: () => Promise<void>): Promise<void> {
  let pending = pendingLoads.get(instance);
  if (!pending) {
    pending = new Map();
    pendingLoads.set(instance, pending);
  }
  const existing = pending.get(key);
  if (existing) return existing;

  const promise = Promise.resolve()
    .then(task)
    .finally(() => {
      pending.delete(key);
    });
  pending.set(key, promise);
  return promise;
}
