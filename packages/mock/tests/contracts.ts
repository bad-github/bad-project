import {create, defineEntity, dataset} from '../src';
import {fakerLoaders} from '../src/locales';
import type {User, UserNode, Dataset, Faker, Entity} from '../src';

export async function checkContracts() {
  const mock = await create({loaders: fakerLoaders, seed: 42, refDate: '2026-01-01'});
  mock.user.generate({address: {city: '上海'}}) satisfies User;
  mock.user.getAll(2)[0] satisfies User;
  mock.user.getPage({count: 2}).data[0] satisfies User;
  mock.user.getRange(0, 2).data[0] satisfies User;
  mock.user.getTree(2, 1)[0] satisfies UserNode;
  dataset.create(mock.user.getAll(2)) satisfies Dataset<User>;
  const order = defineEntity((faker: Faker, input: {amount?: number} = {}) => ({
    id: faker.string.uuid(),
    amount: input.amount ?? 0,
  }));
  const orders = mock.entity(order);
  orders satisfies Entity<{id: string; amount: number}, {amount?: number}>;
  orders.getPage({count: 2}).data[0].amount satisfies number;
  order.bind(mock.faker).generate().id satisfies string;
  // @ts-expect-error 旧入口不再存在。
  void mock.user.getSimpleOne;
  mock.user.generate().address.city satisfies string;
  // @ts-expect-error 页码为数值。
  mock.user.getPage({page: '2'});
  // @ts-expect-error 业务输入类型必须保留。
  orders.generate({amount: 'invalid'});
  // @ts-expect-error 生日必须为 Date。
  mock.user.generate({birthdate: '2000-01-01'});
  mock.user.getAll(2, {
    filter: (row) => {
      // @ts-expect-error 查询回调的记录顶层只读。
      row.id = 1;
      return true;
    },
  });
  // @ts-expect-error 显式要求 Faker 模板或加载器。
  create({seed: 42});
}
