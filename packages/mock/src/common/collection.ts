import type {Dataset, DatasetQuery, Entity, EntityPageOptions, EntityQuery} from './types';
import {createDataset} from './dataset';
import {createMultiple} from './create-multiple';
import {assertCount, assertPage, assertRange} from './validation';

/** 同一模块内按 count 保存快照，所有查询共用同一个集合。 */
export function createCollection<T>(generate: (index: number) => T) {
  const collections = new Map<number, Dataset<T>>();
  const collection = (count: number) => {
    assertCount(count);
    let rows = collections.get(count);
    if (!rows) {
      rows = createDataset(createMultiple(count, generate));
      collections.set(count, rows);
    }
    return rows;
  };
  const getAll = (count = 300, query?: DatasetQuery<T>) => collection(count).getAll(query);
  const getPage = ({count = 300, ...options}: EntityPageOptions<T> = {}) => {
    assertPage(options);
    return collection(count).getPage(options);
  };
  const getRange = (start: number, limit: number, {count = 300, ...query}: EntityQuery<T> = {}) => {
    assertRange(start, limit);
    return collection(count).getRange(start, limit, query);
  };
  return {getAll, getPage, getRange};
}

/** 自定义业务将单条生成函数与公共集合能力组合。 */
export function createEntity<T, Input extends object>(generate: (input?: Input) => T): Entity<T, Input> {
  return {generate, ...createCollection(() => generate())};
}
