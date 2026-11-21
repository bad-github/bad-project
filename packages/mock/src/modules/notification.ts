import type {Faker, Notification} from '../common/types';
import {createEntity} from '../common/collection';
import {definedFields} from '../common/validation';

export function createNotificationModule(faker: Faker) {
  const generate = (overrides: Partial<Notification> = {}): Notification => {
    return {
      id: faker.string.uuid(),
      avatar: faker.image.avatar(),
      title: faker.commerce.productName(),
      content: faker.commerce.productDescription(),
      name: faker.person.fullName(),
      type: faker.helpers.arrayElement(['info', 'warning', 'success', 'error']),
      time: faker.date.recent({days: 10}).toISOString(),
      read: faker.datatype.boolean(),
      ...definedFields(overrides),
    };
  };
  return createEntity(generate);
}
