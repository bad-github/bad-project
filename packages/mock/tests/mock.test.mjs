import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
  create,
  loadFaker,
  createFakerInstance,
  resolveFakerLocale,
  createMultiple,
  dataset,
} from '../dist/esm/index.mjs';
import {fakerLoaders} from '../dist/esm/locales.mjs';

const config = {loaders: fakerLoaders, language: 'en', seed: 42, refDate: '2026-01-01T00:00:00Z'};
const make = (options) => create({...config, ...options});

function ageAt(date, ref) {
  const before =
    ref.getUTCMonth() < date.getUTCMonth() ||
    (ref.getUTCMonth() === date.getUTCMonth() && ref.getUTCDate() < date.getUTCDate());
  return ref.getUTCFullYear() - date.getUTCFullYear() - Number(before);
}

test('equal seed, reference date and call sequence reproduce ordinary generated records', async () => {
  const a = await make();
  const b = await make();
  assert.notEqual(a.faker, b.faker);
  assert.deepEqual(a.user.getAll(3), b.user.getAll(3));
  assert.deepEqual(a.notification.getAll(3), b.notification.getAll(3));
  assert.deepEqual(a.address.getTree({provinceCount: 2}), b.address.getTree({provinceCount: 2}));
});

test('reseeding one scene does not affect another scene or the loaded template', async () => {
  const template = await fakerLoaders.en();
  template.seed(456);
  const a = await make();
  const b = await make();
  const control = await make();
  a.faker.seed(999);
  a.user.getAll(2);
  assert.deepEqual(b.user.generate(), control.user.generate());
  const inherited = await create({faker: template, seed: 42, refDate: config.refDate});
  assert.deepEqual(inherited.user.generate(), (await make()).user.generate());
});

test('loader templates are deduplicated but each caller receives an independent instance', async () => {
  let calls = 0;
  const loaders = {
    en: async () => {
      calls++;
      return await fakerLoaders.en();
    },
  };
  const options = {...config, loaders};
  const [a, b] = await Promise.all([loadFaker(options), loadFaker(options)]);
  assert.equal(calls, 1);
  assert.notEqual(a, b);
  assert.equal(a.string.uuid(), b.string.uuid());
  a.seed(999);
  const c = await loadFaker(options);
  const d = await loadFaker(options);
  assert.equal(c.string.uuid(), d.string.uuid());
  assert.equal(calls, 1);
});

test('failed loaders are evicted and a later call can retry', async () => {
  let attempts = 0;
  const loaders = {
    en: async () => {
      if (++attempts === 1) throw new Error('Offline');
      return fakerLoaders.en();
    },
  };
  const options = {...config, loaders};
  const results = await Promise.allSettled([loadFaker(options), loadFaker(options)]);
  assert.deepEqual(
    results.map((result) => result.status),
    ['rejected', 'rejected']
  );
  assert.equal(attempts, 1);
  await loadFaker(options);
  assert.equal(attempts, 2);
});

test('language resolution distinguishes simplified, traditional and explicit custom locales', async () => {
  for (const language of ['zh', 'zh-CN', 'zh_Hans', 'zh-SG'])
    assert.equal(resolveFakerLocale(language, fakerLoaders), 'zh-CN');
  for (const language of ['zh-TW', 'zh-HK', 'zh-MO', 'zh-Hant-HK'])
    assert.equal(resolveFakerLocale(language, fakerLoaders), 'zh-TW');
  assert.equal(resolveFakerLocale('en-US', fakerLoaders), 'en');
  assert.equal(resolveFakerLocale('zh-Hans-HK', fakerLoaders), 'zh-CN');
  assert.equal(resolveFakerLocale('zh-Hant-CN', fakerLoaders), 'zh-TW');
  assert.equal(resolveFakerLocale('fr', fakerLoaders), 'en');
  assert.equal(resolveFakerLocale('fr-CA', {...fakerLoaders, fr: fakerLoaders.en}), 'fr');
  assert.equal(resolveFakerLocale('zh-HK', {...fakerLoaders, 'zh-HK': fakerLoaders.en}), 'zh-HK');
  assert.throws(() => resolveFakerLocale('fr', fakerLoaders, false), RangeError);
  assert.throws(() => resolveFakerLocale('', fakerLoaders), RangeError);
  assert.throws(() => resolveFakerLocale('en', {en: fakerLoaders.en, EN: fakerLoaders.en}), TypeError);
  const traditional = await loadFaker({...config, language: 'zh-TW'});
  assert.equal(traditional.getMetadata().code, 'zh_TW');
});

test('invalid seeds and reference dates are rejected, and Date inputs are copied', async () => {
  const template = await fakerLoaders.en();
  for (const seed of [NaN, Infinity, -1, 1.5, [], [1, -1]])
    assert.throws(() => createFakerInstance(template, {seed}), RangeError);
  assert.throws(() => createFakerInstance(template, {refDate: 'not-a-date'}), RangeError);
  const date = new Date(config.refDate);
  const a = createFakerInstance(template, {seed: [42, 1], refDate: date});
  date.setUTCFullYear(2050);
  const b = createFakerInstance(template, {seed: [42, 1], refDate: config.refDate});
  assert.equal(a.date.recent().toISOString(), b.date.recent().toISOString());
  a.defaultRefDate().setUTCFullYear(2080);
  assert.equal(a.defaultRefDate().toISOString(), config.refDate.replace('Z', '.000Z'));
});

test('user birthdays, ages and generated work periods are consistent', async () => {
  const mock = await make();
  const ref = new Date(config.refDate);
  for (const user of mock.user.getAll(100)) {
    assert.equal(user.age, ageAt(user.birthdate, ref));
    assert.ok(user.age >= 18 && user.age <= 60);
    assert.ok(user.registeredAt >= user.birthdate && user.registeredAt <= ref);
    for (const job of user.workExperience) {
      assert.ok(job.startDate <= ref);
      if (job.endDate) assert.ok(job.endDate >= job.startDate && job.endDate <= ref);
    }
  }
  assert.equal(mock.user.generate({birthdate: new Date('2000-01-02T00:00:00Z')}).age, 25);
  assert.equal(mock.user.generate({age: 30}).age, 30);
  assert.deepEqual(mock.user.generate({age: 5}).workExperience, []);
  assert.throws(() => mock.user.generate({age: 30, birthdate: new Date('2000-01-01T00:00:00Z')}), /不一致/);
  assert.throws(() => mock.user.generate({birthdate: new Date('2030-01-01')}), RangeError);
  assert.throws(() => mock.user.generate({age: -1}), RangeError);
});

test('user overrides retain defaults and isolate mutable values between records', async () => {
  const mock = await make();
  const options = {
    firstName: 'Alice',
    lastName: 'Li',
    address: {city: '上海', street: undefined},
    preferences: {favoriteColors: ['red']},
  };
  const [a, b] = [mock.user.generate(options), mock.user.generate(options)];
  assert.equal(a.address.city, '上海');
  assert.equal(typeof a.address.street, 'string');
  assert.equal(typeof a.address.country, 'string');
  assert.ok(a.displayName.includes('Alice') && a.displayName.includes('Li'));
  assert.ok(a.email.toLowerCase().includes('alice'));
  a.preferences.favoriteColors.push('blue');
  assert.deepEqual(b.preferences.favoriteColors, ['red']);
  assert.deepEqual(options.preferences.favoriteColors, ['red']);
  assert.deepEqual(
    mock.user.getAll(3).map((row) => row.id),
    [1, 2, 3]
  );
  assert.equal(typeof mock.user.generate({email: undefined}).email, 'string');
});

test('notifications accept field overrides and generate dates relative to the reference date', async () => {
  const mock = await make();
  const row = mock.notification.generate({type: 'error', title: 'Failed', read: false, name: undefined});
  assert.equal(row.type, 'error');
  assert.equal(row.title, 'Failed');
  assert.equal(row.read, false);
  assert.equal(typeof row.name, 'string');
  assert.ok(new Date(row.time) <= new Date(config.refDate));
});

test('counts are validated instead of silently truncating or swallowing invalid values', async () => {
  let calls = 0;
  assert.deepEqual(
    createMultiple(0, () => {
      calls++;
    }),
    []
  );
  assert.deepEqual(
    createMultiple(3, (index) => index),
    [0, 1, 2]
  );
  assert.equal(calls, 0);
  for (const count of [-1, 1.9, NaN, Infinity, Number.MAX_SAFE_INTEGER])
    assert.throws(() => createMultiple(count, () => 1), RangeError);
  const mock = await make();
  assert.throws(() => mock.user.getAll(-1), RangeError);
  assert.throws(() => mock.notification.getAll(1.5), RangeError);
});

test('address counts support fixed values, ranges and empty branches', async () => {
  const mock = await make();
  const tree = mock.address.getTree({provinceCount: 2, cityCount: 3, districtCount: 0});
  assert.equal(tree.length, 2);
  for (const province of tree) {
    assert.equal(province.children.length, 3);
    for (const city of province.children) assert.deepEqual(city.children, []);
  }
  assert.deepEqual(mock.address.getTree({provinceCount: 0}), []);
  for (const options of [
    {provinceCount: -1},
    {cityCount: 1.5},
    {districtCount: {min: 3, max: 1}},
    {provinceCount: 0, districtCount: NaN},
  ]) {
    assert.throws(() => mock.address.getTree(options), RangeError);
  }
});

test('dataset pages are stable snapshots with filtered counts and sorted copies', () => {
  const input = [
    {id: 3, group: 'A', at: new Date('2026-01-01')},
    {id: 1, group: 'B'},
    {id: 2, group: 'A'},
  ];
  const rows = dataset.create(input);
  input[0].id = 999;
  const query = {filter: (row) => row.group === 'A', compare: (a, b) => a.id - b.id};
  const a = rows.getPage({page: 1, pageSize: 1, ...query});
  assert.equal(a.total, 2);
  assert.equal(a.totalPages, 2);
  assert.equal(a.data[0].id, 2);
  a.data[0].id = 100;
  assert.equal(rows.getPage({page: 1, pageSize: 1, ...query}).data[0].id, 2);
  const b = rows.getPage({page: 2, pageSize: 1, ...query});
  assert.equal(b.data[0].id, 3);
  assert.equal(b.hasMore, false);
  assert.ok(b.data[0].at instanceof Date);
  assert.deepEqual(rows.getRange(20, 3).data, []);
  assert.equal(rows.getRange(20, 3).total, 3);
  assert.equal(rows.getAll()[0].id, 3);
  assert.equal(rows.size, 3);
});

test('datasets prevent callback mutations from leaking and validate page/range input', () => {
  const rows = dataset.create([{id: 1}, {id: 2}]);
  rows.getPage({
    filter: (row) => {
      row.id = 999;
      return true;
    },
  });
  assert.equal(rows.getAll()[0].id, 1);
  for (const options of [{page: 0}, {pageSize: 0}, {page: NaN}, {page: 1.5}])
    assert.throws(() => rows.getPage(options), RangeError);
  assert.throws(() => rows.getRange(-1, 2), RangeError);
  assert.throws(() => rows.getRange(0, 1.2), RangeError);
  assert.deepEqual(rows.getRange(0, 0).data, []);
  assert.equal(dataset.create([]).getPage().totalPages, 0);
});
