import type {Faker, SortItem} from '../common/types';
import {createEntity} from '../common/collection';

export function createSortItemModule(faker: Faker) {
  const generate = (input: Partial<SortItem> = {}): SortItem => {
    const id = input.id ?? faker.string.uuid();
    return {id, name: input.name ?? id, type: input.type ?? 'type'};
  };
  const collection = createEntity(generate);
  const getByType = (type: string, count?: number): SortItem[] =>
    collection
      .getAll(count)
      .map((item, index) => ({...item, id: `${type}${index + 1}`, name: `${type}${index + 1}`, type}));
  return {...collection, getByType};
}
