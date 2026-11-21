import type {CreateOptions, EntityDefinition} from './common/types';
import {createFakerInstance, loadFaker} from './faker/load-faker';
import {dataset} from './common/dataset';
import {createUserModule} from './modules/user';
import {createNotificationModule} from './modules/notification';
import {createSortItemModule} from './modules/sort-item';
import {createAddressModule} from './modules/address';

/** 创建独立场景，业务模块共享场景内的 Faker。 */
export async function create(options: CreateOptions) {
  const faker = options.faker ? createFakerInstance(options.faker, options) : await loadFaker(options);
  return {
    faker,
    user: createUserModule(faker),
    notification: createNotificationModule(faker),
    sortItem: createSortItemModule(faker),
    address: createAddressModule(faker),
    dataset,
    entity: <T, Input extends object>(definition: EntityDefinition<T, Input>) => definition.bind(faker),
  };
}
