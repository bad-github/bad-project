import type {DatasetQuery, DatasetPageOptions, DatasetPage, DatasetRange, Dataset} from './types';
import {assertPage, assertRange} from './validation';

/** 保存独立快照，统一实现列表、分页和范围查询。 */
export function createDataset<T>(rows: readonly T[]): Dataset<T> {
  let snapshot: T[];
  try {
    snapshot = structuredClone([...rows]);
  } catch (cause) {
    throw new TypeError('数据集记录必须支持 structuredClone，不能包含函数或 Symbol', {cause});
  }

  const getAll = ({filter, compare}: DatasetQuery<T> = {}): T[] => {
    let result = structuredClone(snapshot);
    if (filter) result = result.filter(filter);
    if (compare) result.sort(compare);
    return result;
  };

  const getRange = (start: number, limit: number, query?: DatasetQuery<T>): DatasetRange<T> => {
    assertRange(start, limit);
    const source = getAll(query);
    const data = source.slice(start, start + limit);
    return {data, total: source.length, start, limit, hasMore: start + data.length < source.length};
  };

  const getPage = (options: DatasetPageOptions<T> = {}): DatasetPage<T> => {
    const {page = 1, pageSize = 20, ...query} = options;
    assertPage({page, pageSize});
    const result = getRange((page - 1) * pageSize, pageSize, query);
    return {...result, page, pageSize, totalPages: Math.ceil(result.total / pageSize)};
  };
  return {
    get size() {
      return snapshot.length;
    },
    getAll,
    getPage,
    getRange,
  };
}

export const dataset = {create: createDataset};
