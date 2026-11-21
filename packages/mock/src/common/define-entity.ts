import type {EntityDefinition, EntityFactory, Faker, Entity} from './types';
import {createEntity} from './collection';

/** 自定义业务直接组合单条生成与集合查询能力。 */
export function defineEntity<T, Input extends object>(factory: EntityFactory<T, Input>): EntityDefinition<T, Input> {
  return {
    generate: factory,
    bind(faker: Faker): Entity<T, Input> {
      return createEntity((input?: Input) => factory(faker, input));
    },
  };
}
