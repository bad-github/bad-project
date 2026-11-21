import {assertCount} from './validation';

/**
 * 按索引同步生成 count 个值；count 可为 0，非法数量会抛出 RangeError。
 * @example createMultiple(3, index => ({id: index + 1}));
 */
export function createMultiple<T>(count: number, factory: (index: number) => T): T[] {
  assertCount(count);
  return Array.from({length: count}, (_, index) => factory(index));
}
