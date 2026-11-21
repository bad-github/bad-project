import {create, defineEntity} from '@workspace/mock';
import * as library from '@workspace/mock';
import {fakerLoaders} from '@workspace/mock/locales';
import type {Faker, User} from '@workspace/mock';

export async function checkBuiltDeclarations() {
  const mock = await create({loaders: fakerLoaders, seed: 42});
  mock.faker satisfies Faker;
  mock.user.getTree(2, 1)[0].firstName satisfies string;
  mock.user.getPage({count: 2}).data[0] satisfies User;
  mock.notification.getPage({count: 2}).data[0].read satisfies boolean;
  mock.sortItem.getByType('A', 2)[0].type satisfies string;
  const product = defineEntity((faker: Faker, input: {price?: number} = {}) => ({
    id: faker.string.uuid(),
    price: input.price ?? 10,
  }));
  const products = mock.entity(product);
  products.getAll(2)[0].price satisfies number;
  // @ts-expect-error 产物声明必须保留业务参数类型。
  products.generate({price: 'invalid'});
  // @ts-expect-error Faker 只有类型导出。
  void library.Faker;
}
