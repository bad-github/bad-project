import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {spawnSync} from 'node:child_process';
import {createI18n} from '../dist/esm/index.mjs';

function deferred() {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return {promise, resolve};
}

const loadNamespaces = (i18n, ns) =>
  new Promise((resolve, reject) => {
    i18n.loadNamespaces(ns, (error) => (error ? reject(error) : resolve()));
  });

test('initialization loads only the current language, fallback and initial namespace', async () => {
  const calls = [];
  const loader = (id, data) => async () => {
    calls.push(id);
    return data;
  };
  const {i18n, ready} = createI18n({
    lng: 'en',
    fallbackLng: 'zh',
    loaders: {
      en: {translation: loader('en/translation', {hello: 'Hello'}), order: loader('en/order', {title: 'Orders'})},
      zh: {
        translation: loader('zh/translation', {hello: '你好', fallbackOnly: '回退'}),
        order: loader('zh/order', {title: '订单'}),
      },
      fr: {translation: loader('fr/translation', {hello: 'Bonjour'})},
    },
  });
  await ready;
  assert.deepEqual(calls.sort(), ['en/translation', 'zh/translation']);
  assert.equal(i18n.t('hello'), 'Hello');
  assert.equal(i18n.t('fallbackOnly'), '回退');
  assert.equal(i18n.hasResourceBundle('fr', 'translation'), false);
  await Promise.all([loadNamespaces(i18n, 'order'), loadNamespaces(i18n, 'order')]);
  assert.deepEqual(calls.sort(), ['en/order', 'en/translation', 'zh/order', 'zh/translation']);
  assert.equal(i18n.t('order:title'), 'Orders');
});

test('changeLanguage loads activated namespaces once and reuses previously loaded bundles', async () => {
  const calls = [];
  const make = (id) => async () => {
    calls.push(id);
    return {title: id};
  };
  const {i18n, ready} = createI18n({
    lng: 'zh',
    fallbackLng: false,
    loaders: {
      zh: {translation: make('zh/main'), order: make('zh/order')},
      en: {translation: make('en/main'), order: make('en/order')},
    },
  });
  await ready;
  assert.deepEqual(calls, ['zh/main']);
  await loadNamespaces(i18n, 'order');
  await Promise.all([i18n.changeLanguage('en'), i18n.changeLanguage('en')]);
  assert.equal(i18n.t('title'), 'en/main');
  assert.equal(i18n.t('order:title'), 'en/order');
  await i18n.changeLanguage('zh');
  await i18n.changeLanguage('en');
  assert.equal(calls.length, 4);
});

test('lazy instances clone cached module data and never share resource stores', async () => {
  const source = {nested: {hello: 'Original'}, items: ['first']};
  let calls = 0;
  const loaders = {
    en: {
      translation: async () => {
        calls++;
        return source;
      },
    },
  };
  const a = createI18n({lng: 'en', fallbackLng: false, loaders});
  const b = createI18n({lng: 'en', fallbackLng: false, loaders});
  await Promise.all([a.ready, b.ready]);
  a.i18n.addResource('en', 'translation', 'nested.hello', 'Changed');
  a.i18n.getResourceBundle('en', 'translation').items.push('extra');
  assert.equal(b.i18n.t('nested.hello'), 'Original');
  assert.equal(source.nested.hello, 'Original');
  assert.deepEqual(source.items, ['first']);
  assert.equal(calls, 2);
});

test('initial bundles can be supplied eagerly while other namespaces stay lazy', async () => {
  let calls = 0;
  const {i18n, ready} = createI18n({
    lng: 'en',
    fallbackLng: false,
    resources: {en: {translation: {hello: 'Initial'}}},
    loaders: {
      en: {
        translation: async () => {
          throw new Error('Already supplied');
        },
        order: async () => {
          calls++;
          return {title: 'Orders'};
        },
      },
    },
  });
  await ready;
  assert.equal(calls, 0);
  assert.equal(i18n.t('hello'), 'Initial');
  await loadNamespaces(i18n, 'order');
  assert.equal(calls, 1);
  assert.equal(i18n.t('order:title'), 'Orders');
});

test('ready waits for resources and rejects when initialization fails', async () => {
  const gate = deferred();
  const result = createI18n({
    lng: 'en',
    fallbackLng: false,
    loaders: {
      en: {
        translation: async () => {
          await gate.promise;
          return {hello: 'Loaded'};
        },
      },
    },
  });
  let settled = false;
  result.ready.then(() => {
    settled = true;
  });
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(settled, false);
  gate.resolve();
  await result.ready;
  assert.equal(result.i18n.t('hello'), 'Loaded');
  const failed = createI18n({
    lng: 'en',
    fallbackLng: false,
    loaders: {
      en: {
        translation: async () => {
          throw new Error('Offline');
        },
      },
    },
  });
  await assert.rejects(
    failed.ready,
    (error) => error instanceof AggregateError && error.errors[0].message === 'Offline'
  );
});

test('failed namespaces report errors and retry on the next explicit call', async () => {
  let attempts = 0;
  const {i18n, ready} = createI18n({
    lng: 'en',
    fallbackLng: false,
    loaders: {
      en: {
        translation: async () => ({hello: 'Hello'}),
        order: async () => {
          if (++attempts === 1) throw new Error('Offline');
          return {title: 'Orders'};
        },
      },
    },
  });
  await ready;
  await assert.rejects(loadNamespaces(i18n, 'order'));
  assert.equal(i18n.hasResourceBundle('en', 'order'), false);
  await loadNamespaces(i18n, 'order');
  assert.equal(attempts, 2);
  assert.equal(i18n.t('order:title'), 'Orders');
});

test('language switch failures reach the native callback and can be retried', async () => {
  let attempts = 0;
  const {i18n, ready} = createI18n({
    lng: 'zh',
    fallbackLng: false,
    loaders: {
      zh: {translation: async () => ({hello: '你好'})},
      en: {
        translation: async () => {
          if (++attempts === 1) throw new Error('Offline');
          return {hello: 'Hello'};
        },
      },
    },
  });
  await ready;
  const error = await new Promise((resolve) => i18n.changeLanguage('en', resolve));
  assert.ok(error);
  await new Promise((resolve, reject) => i18n.changeLanguage('en', (error) => (error ? reject(error) : resolve())));
  assert.equal(attempts, 2);
  assert.equal(i18n.t('hello'), 'Hello');
});

test('missing loader registrations are reported instead of silently installing empty bundles', async () => {
  const {i18n, ready} = createI18n({
    lng: 'en',
    fallbackLng: false,
    loaders: {
      en: {translation: async () => ({hello: 'Hello'})},
    },
  });
  await ready;
  await assert.rejects(loadNamespaces(i18n, 'unregistered'));
  assert.equal(i18n.hasResourceBundle('en', 'unregistered'), false);
});

test('the latest language switch wins when responses finish out of order', async () => {
  const enGate = deferred();
  const zhGate = deferred();
  const {i18n, ready} = createI18n({
    lng: 'fr',
    fallbackLng: false,
    loaders: {
      fr: {translation: async () => ({hello: 'Bonjour'})},
      en: {
        translation: async () => {
          await enGate.promise;
          return {hello: 'Hello'};
        },
      },
      zh: {
        translation: async () => {
          await zhGate.promise;
          return {hello: '你好'};
        },
      },
    },
  });
  await ready;
  const en = i18n.changeLanguage('en');
  const zh = i18n.changeLanguage('zh');
  zhGate.resolve();
  await zh;
  enGate.resolve();
  await en;
  assert.equal(i18n.language, 'zh');
  assert.equal(i18n.t('hello'), '你好');
});

test('CJS entry and loader registry do not load language chunks until requested', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
    const assert = require('node:assert/strict');
    const {createI18n} = require('@workspace/i18n');
    const {localeLoaders} = require('@workspace/i18n/locales');
    const chunks = () => Object.keys(require.cache).filter(p => /dist[/\\\\]cjs[/\\\\]locales[/\\\\]/.test(p));
    assert.equal(chunks().length, 0);
    const {i18n, ready} = createI18n({lng: 'zh', fallbackLng: 'zh', loaders: localeLoaders});
    ready.then(async () => {
      assert.equal(chunks().length, 1);
      assert.equal(i18n.hasResourceBundle('en', 'translation'), false);
      await i18n.changeLanguage('en');
      assert.equal(chunks().length, 2);
      assert.equal(i18n.t('notify.viewAll'), 'View All');
    }).catch(error => { console.error(error); process.exitCode = 1; });
  `,
    ],
    {cwd: new URL('..', import.meta.url), encoding: 'utf8'}
  );
  assert.equal(result.status, 0, result.stderr);
});

test('core ESM and UMD bundles contain no built-in translations', () => {
  for (const file of ['../dist/esm/index.mjs', '../dist/umd/index.js']) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    // 注释示例里也包含文案，只检查实际的资源字段定义。
    assert.doesNotMatch(source, /viewAll\s*:\s*['"]查看所有['"]/);
    assert.doesNotMatch(source, /welcomeBack\s*:\s*['"]Welcome back['"]/);
  }
});

test('UMD core accepts asynchronous browser loaders without bundling language data', async () => {
  const require = createRequire(import.meta.url);
  const context = {
    i18next: require('i18next'),
    ReactI18next: require('react-i18next'),
    console,
  };
  runInNewContext(readFileSync(new URL('../dist/umd/index.js', import.meta.url), 'utf8'), context);
  const {i18n, ready} = context.BadProjectI18n.createI18n({
    lng: 'en',
    fallbackLng: false,
    loaders: {en: {translation: async () => ({hello: 'Browser loader'})}},
  });
  await ready;
  assert.equal(i18n.t('hello'), 'Browser loader');
});
