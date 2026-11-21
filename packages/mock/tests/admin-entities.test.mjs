import assert from 'node:assert/strict';
import {test} from 'node:test';
import {create} from '../dist/esm/index.mjs';
import {fakerLoaders} from '../dist/esm/locales.mjs';

const options = {loaders: fakerLoaders, seed: 42, refDate: '2026-01-01T00:00:00Z'};

test('virtual list items keep stable identities across overlapping queries', async () => {
  const mock = await create(options);
  const all = mock.user.getAll();
  assert.equal(all.length, 300);
  assert.deepEqual(mock.user.getRange(10, 20).data.slice(5), mock.user.getRange(15, 15).data);
  assert.deepEqual(mock.user.getPage({page: 2, pageSize: 20}).data, all.slice(20, 40));
  const names = all.map((row) => row.name);
  assert.ok(names.every((name) => typeof name === 'string' && name.length > 0));
  all[0].name = 'changed';
  assert.deepEqual(
    mock.user.getAll().map((row) => row.name),
    names
  );
  assert.ok(mock.user.generate().text.length > 0);
});

test('users share coherent identity fields and include profile and list fields', async () => {
  const mock = await create(options);
  const {generate: createUser} = mock.user;
  const user = createUser({id: 0, firstName: 'Alice', lastName: 'Li', age: 0, text: '', progress: 0, status: 'single'});
  assert.equal(user.id, 0);
  assert.equal(user.age, 0);
  assert.equal(user.text, '');
  assert.equal(user.progress, 0);
  assert.ok(user.name.includes('Alice') && user.name.includes('Li'));
  assert.ok(user.email.toLowerCase().includes('alice'));
  assert.ok(user.address.city);
  assert.equal(typeof user.password, 'string');
  assert.deepEqual(user.workExperience, []);
  assert.ok(mock.user.generate({age: 20}).address.city);
});

test('sorting entities preserve group labels and do not generate unused user profiles', async () => {
  const mock = await create(options);
  assert.deepEqual(mock.sortItem.getByType('A', 3), [
    {id: 'A1', name: 'A1', type: 'A'},
    {id: 'A2', name: 'A2', type: 'A'},
    {id: 'A3', name: 'A3', type: 'A'},
  ]);
  assert.deepEqual(mock.sortItem.getAll(0), []);
  assert.equal(mock.sortItem.generate({name: 'custom'}).name, 'custom');
});

test('users support flat queries and trees with unique identities', async () => {
  const mock = await create(options);
  const {getTree: tree} = mock.user;
  const roots = tree(2, 3, 1);
  assert.equal(roots.length, 2);
  for (const root of roots) {
    assert.equal(root.subRows.length, 3);
    for (const child of root.subRows) {
      assert.equal(child.subRows.length, 1);
      assert.equal(child.subRows[0].subRows, undefined);
    }
    assert.ok(root.age >= 18 && root.age <= 60);
    assert.ok(root.progress >= 0 && root.progress <= 100);
    assert.ok(['relationship', 'complicated', 'single'].includes(root.status));
  }
  const flatten = (rows) => rows.flatMap((row) => [row, ...flatten(row.subRows ?? [])]);
  const ids = flatten(roots).map((row) => row.id);
  assert.equal(new Set(ids).size, 14);
  assert.ok(flatten(roots).every((row) => row.text === '' && Array.isArray(row.workExperience)));
  roots[0].subRows[0].firstName = 'changed';
  assert.notEqual(roots[1].subRows[0].firstName, 'changed');
  assert.equal(mock.user.getPage({count: 4, pageSize: 2}).totalPages, 2);
  assert.deepEqual(tree(), []);
  assert.deepEqual(tree(0, 3), []);
  assert.equal(tree(2, 0, 3)[0].subRows, undefined);
});

test('invalid user ages fail before consuming random state', async () => {
  const mock = await create(options);
  const control = await create(options);
  for (const age of [-1, 121, 0.5, NaN, Infinity]) {
    assert.throws(() => mock.user.generate({age}), RangeError);
  }
  assert.deepEqual(mock.user.generate(), control.user.generate());
});

test('invalid deep tree counts fail before consuming the scene random sequence', async () => {
  const mock = await create(options);
  const control = await create(options);
  for (const count of [-1, 1.5, NaN, Infinity]) {
    assert.throws(() => mock.user.getTree(2, count), RangeError);
    assert.throws(() => mock.user.getTree(0, count), RangeError);
  }
  assert.deepEqual(mock.user.generate(), control.user.generate());
});

test('all migrated entities reproduce using equal scene configurations', async () => {
  const a = await create(options);
  const b = await create(options);
  assert.deepEqual(a.user.getAll(3), b.user.getAll(3));
  assert.deepEqual(a.sortItem.getAll(3), b.sortItem.getAll(3));
  assert.deepEqual(a.user.getTree(2, 1), b.user.getTree(2, 1));
});
