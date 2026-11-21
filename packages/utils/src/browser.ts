import {pickBy, mapValues} from 'lodash-es';
import type {SafePropsOptions} from './types';

/**
 * 安全检查 API 路径是否存在，例如 BroadcastChannel、navigator.clipboard.writeText。
 * 默认从 globalThis 查找，可传入 window、iframe 的 window 或测试替身作为 target。
 *
 * 只判断路径可读取且最终值不是 null / undefined，不调用 API、不申请权限、不写入存储。
 * 返回 true 不保证调用一定成功，权限、配额、构造失败等仍需在使用处 try/catch。
 * 不缓存结果，以便反映运行环境或权限变化；SSR 中缺少 window 时也不会抛异常。
 */
function canIUse(path: string, target: unknown = globalThis): boolean {
  const keys = path.trim().split('.');
  if (keys.some((key) => key.length === 0)) return false;

  try {
    let current = target;
    for (const key of keys) {
      // 中间节点必须是对象或函数，不能只判断真假：某些有效属性的值可能为 false 或 0。
      if (current === null || (typeof current !== 'object' && typeof current !== 'function')) return false;
      current = Reflect.get(current, key);
    }
    return current !== undefined && current !== null;
  } catch {
    // localStorage 等属性的 getter 在受限环境中可能直接抛错，统一视为当前不可用。
    return false;
  }
}

/**
 *
 * @param props 去掉undefined值的属性，并将布尔属性值转成字符串
 * @param options 删除的属性
 * @returns
 */
function getSafeProps(props: Record<string, any>, options: SafePropsOptions = {excludeKeys: []}): Record<string, any> {
  const {excludeKeys = []} = options;
  // 过滤undefined和排除keys
  const filtered = pickBy(props, (value, key) => value !== undefined && !excludeKeys.includes(key));
  // 将 boolean 转成 string
  const sanitized = mapValues(filtered, (value) => (typeof value === 'boolean' ? value.toString() : value));
  return sanitized;
}

/**
 * 多少帧后调用callback
 * @param frames
 * @param callback
 */
function runAfterFrames(callback: () => void, frames = 1) {
  function step(remaining: number) {
    if (remaining <= 0) {
      callback();
    } else {
      requestAnimationFrame(() => step(remaining - 1));
    }
  }
  step(frames);
}

/** 浏览器能力、DOM 属性与渲染调度。 */
export const browser = {canIUse, getSafeProps, runAfterFrames};
