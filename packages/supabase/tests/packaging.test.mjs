import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import * as esm from '../dist/esm/index.mjs';

test('ESM, CJS and UMD expose consistent factories, helpers and error classes', () => {
  const require = createRequire(import.meta.url);
  const cjs = require('../dist/cjs/index.cjs');
  const context = {supabase: require('@supabase/supabase-js')};
  runInNewContext(readFileSync(new URL('../dist/umd/index.js', import.meta.url), 'utf8'), context);
  const umd = context.BadProjectSupabase;
  assert.deepEqual(Object.keys(esm).sort(), Object.keys(cjs).sort());
  assert.deepEqual(Object.keys(esm).sort(), Object.keys(umd).sort());
  for (const library of [esm, cjs, umd]) {
    const error = new library.FunctionsHttpError(new Response('Offline', {status: 400}));
    assert.equal(error.context.status, 400);
    assert.throws(
      () => library.result.unwrap({data: null, error}),
      (thrown) => thrown === error
    );
    assert.equal(typeof library.createSupabaseApi, 'function');
    assert.equal(typeof library.createSupabaseClient, 'function');
    assert.equal(typeof library.SupabaseClient, 'function');
    assert.equal(typeof library.RealtimeChannel, 'function');
    assert.equal('createClient' in library, false);
  }
});
