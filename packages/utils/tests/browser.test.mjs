import {browser} from '../src/browser.ts';
import assert from 'node:assert/strict';
import {test} from 'node:test';

test('supports direct API names, nested paths and inherited browser methods', () => {
  class Environment {
    method() {}
  }
  const target = Object.assign(new Environment(), {navigator: {clipboard: {writeText() {}}}});
  assert.equal(browser.canIUse('method', target), true);
  assert.equal(browser.canIUse('navigator.clipboard.writeText', target), true);
  assert.equal(browser.canIUse('navigator.clipboard.readText', target), false);
});

test('returns false for missing environments, intermediate nodes and invalid paths', () => {
  for (const target of [null, 0, false, 'text', {}]) {
    assert.equal(browser.canIUse('navigator.clipboard', target), false);
  }
  for (const path of ['', ' ', '.navigator', 'navigator.', 'navigator..clipboard']) {
    assert.equal(browser.canIUse(path, {}), false);
  }
  assert.equal(browser.canIUse('clipboard.writeText', {clipboard: null}), false);
  assert.equal(browser.canIUse('clipboard.writeText', {clipboard: undefined}), false);
});

test('false and zero are existing property values; null and undefined are not', () => {
  const target = {online: false, width: 0, empty: '', absent: null, missing: undefined};
  for (const path of ['online', 'width', 'empty']) assert.equal(browser.canIUse(path, target), true);
  for (const path of ['absent', 'missing']) assert.equal(browser.canIUse(path, target), false);
});

test('catches restricted getters and does not invoke APIs or mutate storage', () => {
  const target = {
    get localStorage() {
      throw new Error('Access denied');
    },
    BroadcastChannel: class {
      constructor() {
        throw new Error('Must not construct');
      }
    },
    requestPermission() {
      throw new Error('Must not call');
    },
  };
  assert.equal(browser.canIUse('localStorage.getItem', target), false);
  assert.equal(browser.canIUse('BroadcastChannel', target), true);
  assert.equal(browser.canIUse('requestPermission', target), true);
});

test('uses globalThis by default and checks again instead of caching results', () => {
  const target = {};
  assert.equal(browser.canIUse('feature', target), false);
  target.feature = () => {};
  assert.equal(browser.canIUse('feature', target), true);
  assert.equal(browser.canIUse('Math.max'), true);
  // Node 环境拥有自己的 API，不应把 Node 的 BroadcastChannel 当作 window 存在的证据。
  assert.equal(browser.canIUse('window'), false);
});
