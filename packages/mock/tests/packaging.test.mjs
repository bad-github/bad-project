import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {spawnSync} from 'node:child_process';
import * as esm from '../dist/esm/index.mjs';
import {fakerLoaders} from '../dist/esm/locales.mjs';

test('core entries and UMD do not contain Faker runtime imports or locale data', () => {
  for (const file of ['../dist/esm/index.mjs', '../dist/cjs/index.cjs', '../dist/umd/index.js']) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /(?:require\(|import\(|from\s*)['"]@faker-js\/faker/);
  }
});

test('CJS core, lazy locale registry and isolated contexts work through package exports', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
    const assert = require('node:assert/strict');
    const {create} = require('@workspace/mock');
    const {fakerLoaders} = require('@workspace/mock/locales');
    assert.equal(Object.keys(require.cache).some(file => file.includes('@faker-js')), false);
    create({loaders: fakerLoaders, language: 'zh-TW', seed: 42, refDate: '2026-01-01'}).then(mock => {
      assert.equal(mock.faker.getMetadata().code, 'zh_TW');
      assert.equal(mock.user.getAll(2).length, 2);
    }).catch(error => {console.error(error); process.exitCode = 1;});
  `,
    ],
    {cwd: new URL('..', import.meta.url), encoding: 'utf8'}
  );
  assert.equal(result.status, 0, result.stderr);
});

test('UMD runs without import maps using a host-provided Faker template', async () => {
  const require = createRequire(import.meta.url);
  const context = {structuredClone, Date};
  runInNewContext(readFileSync(new URL('../dist/umd/index.js', import.meta.url), 'utf8'), context);
  const umd = context.BadProjectMock;
  const cjs = require('../dist/cjs/index.cjs');
  assert.deepEqual(Object.keys(umd).sort(), Object.keys(esm).sort());
  assert.deepEqual(Object.keys(cjs).sort(), Object.keys(esm).sort());
  const template = await fakerLoaders.en();
  const options = {faker: template, seed: 42, refDate: '2026-01-01'};
  const a = await umd.create(options);
  const b = await esm.create(options);
  assert.equal(a.user.generate().email, b.user.generate().email);
  assert.equal(umd.dataset.create([{id: 1}]).getPage().total, 1);
});
