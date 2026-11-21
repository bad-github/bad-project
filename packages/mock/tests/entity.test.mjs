import assert from 'node:assert/strict';
import {test} from 'node:test';
import {create, defineEntity, dataset} from '../dist/esm/index.mjs';
import {fakerLoaders} from '../dist/esm/locales.mjs';

const options = {loaders: fakerLoaders, seed: 42, refDate: '2026-01-01T00:00:00Z'};
const order = defineEntity((faker, input = {}) => ({
  id: input.id ?? faker.string.uuid(),
  amount: input.amount ?? faker.number.int({min: 1, max: 100}),
  status: input.status ?? 'pending',
}));

test('custom definitions bind independent scenes using the same get API', async () => {
  const a = await create(options);
  const b = await create(options);
  const orders = a.entity(order);
  assert.deepEqual(orders.getAll(3), order.bind(b.faker).getAll(3));
  assert.equal(orders.generate({status: 'paid'}).status, 'paid');
  assert.equal(order.generate(a.faker, {amount: 0}).amount, 0);
});

test('getAll/getPage/getRange share one generated source for the same count', async () => {
  const mock = await create(options);
  let calls = 0;
  const entity = mock.entity(
    defineEntity((_faker, input = {}) => {
      calls++;
      const id = input.id ?? calls;
      return {id, active: id % 2 === 0};
    })
  );
  const query = {filter: (row) => row.active, compare: (a, b) => b.id - a.id};
  const list = entity.getAll(6, query);
  assert.deepEqual(
    list.map((row) => row.id),
    [6, 4, 2]
  );
  const first = entity.getPage({count: 6, ...query, pageSize: 2});
  const second = entity.getPage({count: 6, ...query, page: 2, pageSize: 2});
  assert.deepEqual([...first.data, ...second.data], list);
  assert.deepEqual(entity.getRange(1, 2, {count: 6, ...query}).data, list.slice(1));
  assert.equal(first.total, 3);
  assert.equal(first.totalPages, 2);
  assert.equal(first.hasMore, true);
  assert.equal(second.hasMore, false);
  assert.equal(calls, 6);
  list[0].id = 999;
  assert.equal(entity.getAll(6, query)[0].id, 6);
  entity.generate({id: 100});
  assert.equal(entity.getAll(6).length, 6);
  assert.equal(calls, 7);
});

test('all record modules use the same stable querying capabilities', async () => {
  const mock = await create(options);
  for (const entity of [mock.user, mock.notification, mock.sortItem]) {
    const all = entity.getAll(4);
    assert.deepEqual(entity.getPage({count: 4, pageSize: 2}).data, all.slice(0, 2));
    assert.equal(entity.getRange(2, 2, {count: 4}).hasMore, false);
  }
  assert.ok(mock.user.getAll(4)[0].address);
  assert.ok(mock.user.getAll(4)[0].name);
});

test('invalid queries fail before generating records and zero has an empty source', async () => {
  const mock = await create(options);
  let calls = 0;
  const entity = mock.entity(defineEntity(() => ({id: ++calls})));
  for (const count of [-1, 1.5, NaN, Infinity, 0x100000000]) {
    assert.throws(() => entity.getAll(count), RangeError);
    assert.throws(() => entity.getPage({count}), RangeError);
  }
  assert.throws(() => entity.getPage({page: 0}), RangeError);
  assert.throws(() => entity.getRange(-1, 2), RangeError);
  assert.deepEqual(entity.getAll(0), []);
  assert.equal(entity.getPage({count: 0}).totalPages, 0);
  assert.equal(calls, 0);
});

test('snapshots isolate nested values, callback references and caller-owned records', () => {
  const original = [{id: 1, nested: {value: 2}, at: new Date('2026-01-01'), value: 1n, map: new Map([['a', 2]])}];
  const rows = dataset.create(original);
  original[0].nested.value = 100;
  let captured;
  const result = rows.getAll({
    filter: (row) => {
      captured = row;
      row.nested.value = 9;
      return true;
    },
  });
  captured.nested.value = 10;
  result[0].at.setUTCFullYear(2050);
  result[0].map.set('a', 100);
  assert.equal(rows.getAll()[0].nested.value, 2);
  assert.equal(rows.getAll()[0].at.getUTCFullYear(), 2026);
  assert.equal(rows.getAll()[0].map.get('a'), 2);
  assert.equal(rows.getAll()[0].value, 1n);
});

test('stable sorting, empty queries and large offsets have consistent boundaries', () => {
  const rows = dataset.create([{id: 3}, {id: 1}, {id: 2}]);
  assert.deepEqual(
    rows.getAll({compare: () => 0}).map((row) => row.id),
    [3, 1, 2]
  );
  assert.deepEqual(rows.getPage({filter: () => false}).data, []);
  assert.equal(rows.getPage({filter: () => false}).totalPages, 0);
  assert.deepEqual(rows.getRange(0x100000000, 1).data, []);
  assert.deepEqual(rows.getPage({page: 0xffffffff, pageSize: 2}).data, []);
  assert.throws(() => rows.getRange(Number.MAX_SAFE_INTEGER, 1), RangeError);
  assert.throws(() => rows.getPage({page: 0xffffffff, pageSize: 0xffffffff}), RangeError);
});

test('non-cloneable records fail explicitly when building a query source', async () => {
  const mock = await create(options);
  const entity = mock.entity(defineEntity(() => ({callback: () => 1})));
  assert.equal(entity.generate().callback(), 1);
  assert.throws(
    () => entity.getAll(1),
    (error) => error instanceof TypeError && error.cause !== undefined
  );
  assert.throws(() => dataset.create([{value: Symbol('x')}]), /structuredClone/);
});

test('module methods retain their context when destructured', async () => {
  const mock = await create(options);
  const {generate, getAll, getPage, getRange} = mock.notification;
  assert.equal(generate({id: 'one'}).id, 'one');
  const all = getAll(3);
  assert.deepEqual(getPage({count: 3, page: 2, pageSize: 1}).data, all.slice(1, 2));
  assert.deepEqual(getRange(2, 1, {count: 3}).data, all.slice(2));
  const {generate: userOne, getAll: userAll, getPage: userPage, getRange: userRange, getTree} = mock.user;
  assert.equal(userOne({id: 1}).id, 1);
  const users = userAll(3);
  assert.deepEqual(userPage({count: 3}).data, users);
  assert.deepEqual(userRange(0, 1, {count: 3}).data, users.slice(0, 1));
  assert.equal(getTree(1).length, 1);
});
