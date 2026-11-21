import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {I18nextProvider, useTranslation} from 'react-i18next';
import {
  createI18n,
  detectLanguage,
  addLocale,
  addLocales,
  safeAddLocale,
  safeAddLocales,
  loadLocale,
  loadLocales,
  safeLoadLocale,
  safeLoadLocales,
} from '../dist/esm/index.mjs';
import {resources} from '../dist/esm/resources.mjs';
import {localeLoaders} from '../dist/esm/locales.mjs';

async function instance(options = {}) {
  const result = createI18n({
    lng: 'en',
    ...(!options.resources && !options.loaders ? {loaders: localeLoaders} : {}),
    ...options,
  });
  await result.ready;
  return result.i18n;
}

function deferred() {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return {promise, resolve};
}

test('default resources and nested changes are isolated between instances', async () => {
  const a = await instance();
  const b = await instance();
  const original = resources.en.translation.notify.viewAll;
  a.addResource('en', 'translation', 'notify.viewAll', 'Changed');
  a.addResource('en', 'translation', 'isolatedKey', 'Only A');
  assert.equal(b.t('notify.viewAll'), original);
  assert.equal(b.exists('isolatedKey'), false);
  assert.equal(resources.en.translation.notify.viewAll, original);
  a.removeResourceBundle('zh', 'translation');
  assert.equal(b.hasResourceBundle('zh', 'translation'), true);
  assert.ok(resources.zh.translation);
});

test('custom resources, nested objects and arrays are copied for each instance', async () => {
  const source = {en: {translation: {nested: {value: 'Original'}, list: ['first', {value: 'second'}]}}};
  const a = await instance({resources: source});
  const b = await instance({resources: source});
  a.getResourceBundle('en', 'translation').nested.value = 'Changed';
  a.getResourceBundle('en', 'translation').list[1].value = 'Changed';
  assert.equal(source.en.translation.nested.value, 'Original');
  assert.equal(source.en.translation.list[1].value, 'second');
  assert.equal(b.t('nested.value'), 'Original');
  assert.equal(b.getResource('en', 'translation', 'list.1.value'), 'second');
});

test('React providers use their own instance after another instance initializes', async () => {
  const a = await instance({resources: {en: {translation: {hello: 'App A'}}}});
  const b = await instance({resources: {en: {translation: {hello: 'App B'}}}});
  function Label() {
    const {t} = useTranslation();
    return createElement('span', null, t('hello'));
  }
  const render = (i18n) => renderToStaticMarkup(createElement(I18nextProvider, {i18n}, createElement(Label)));
  assert.equal(render(a), '<span>App A</span>');
  assert.equal(render(b), '<span>App B</span>');
});

test('initialization forwards namespace, fallback and interpolation options', async () => {
  const a = await instance({
    lng: 'fr',
    fallbackLng: false,
    defaultNS: 'custom',
    resources: {fr: {custom: {hello: 'Bonjour [[name]]'}}},
    interpolation: {prefix: '[[', suffix: ']]'},
  });
  assert.equal(a.t('hello', {name: 'Alice'}), 'Bonjour Alice');
  assert.equal(a.t('missing'), 'missing');
});

test('dynamic imports explicitly extract default and named resource exports', async () => {
  const a = await instance();
  await loadLocale(a, 'en', 'user', () =>
    import('data:text/javascript,export default {hello:"Hello"}').then((m) => m.default)
  );
  await loadLocales(a, () =>
    import('data:text/javascript,export const resources={en:{other:{hello:"Other"}}}').then((m) => m.resources)
  );
  assert.equal(a.t('user:hello'), 'Hello');
  assert.equal(a.t('other:hello'), 'Other');
  assert.equal(a.getResource('en', 'user', 'default'), undefined);
});

test('safe single loads share the same in-flight task and skip loaded bundles', async () => {
  const a = await instance();
  const gate = deferred();
  let calls = 0;
  const loader = async () => {
    calls++;
    await gate.promise;
    return {hello: 'First'};
  };
  const first = safeLoadLocale(a, 'en', 'user', loader);
  const second = safeLoadLocale(a, 'en', 'user', async () => {
    throw new Error('Should not run');
  });
  assert.equal(first, second);
  gate.resolve();
  await Promise.all([first, second]);
  await safeLoadLocale(a, 'en', 'user', loader);
  assert.equal(calls, 1);
  assert.equal(a.t('user:hello'), 'First');
});

test('single load deduplication is scoped to instance, language and namespace', async () => {
  const a = await instance();
  const b = await instance();
  let calls = 0;
  const loader = async () => {
    calls++;
    return {hello: 'Hello'};
  };
  await Promise.all([
    safeLoadLocale(a, 'en', 'user', loader),
    safeLoadLocale(b, 'en', 'user', loader),
    safeLoadLocale(a, 'zh', 'user', loader),
    safeLoadLocale(a, 'en', 'other', loader),
  ]);
  assert.equal(calls, 4);
});

test('failed single loads reject all waiters and can be retried', async () => {
  const a = await instance();
  const error = new Error('Load failed');
  const results = await Promise.allSettled([
    safeLoadLocale(a, 'en', 'user', async () => {
      throw error;
    }),
    safeLoadLocale(a, 'en', 'user', async () => ({hello: 'Unused'})),
  ]);
  for (const result of results) {
    assert.equal(result.status, 'rejected');
    assert.equal(result.reason, error);
  }
  await safeLoadLocale(a, 'en', 'user', async () => ({hello: 'Retry'}));
  assert.equal(a.t('user:hello'), 'Retry');
});

test('safe single loads preserve bundles added while waiting', async () => {
  const a = await instance();
  const gate = deferred();
  const pending = safeLoadLocale(a, 'en', 'user', async () => {
    await gate.promise;
    return {hello: 'Late'};
  });
  addLocale(a, 'en', 'user', {hello: 'Manual'});
  gate.resolve();
  await pending;
  assert.equal(a.t('user:hello'), 'Manual');
});

test('safe multi loads deduplicate by loader within an instance and preserve existing namespaces', async () => {
  const a = await instance();
  const b = await instance();
  let calls = 0;
  const gate = deferred();
  const loader = async () => {
    calls++;
    await gate.promise;
    return {en: {user: {hello: 'Loaded'}, other: {hello: 'Other'}}};
  };
  const first = safeLoadLocales(a, loader);
  const second = safeLoadLocales(a, loader);
  assert.equal(first, second);
  const separate = safeLoadLocales(b, loader);
  addLocale(a, 'en', 'user', {hello: 'Manual'});
  gate.resolve();
  await Promise.all([first, second, separate]);
  assert.equal(calls, 2);
  assert.equal(a.t('user:hello'), 'Manual');
  assert.equal(a.t('other:hello'), 'Other');
  assert.equal(b.t('user:hello'), 'Loaded');
});

test('failed multi loads can retry using the same loader', async () => {
  const a = await instance();
  let calls = 0;
  const loader = async () => {
    if (++calls === 1) throw new Error('Load failed');
    return {en: {user: {hello: 'Retry'}}};
  };
  await assert.rejects(safeLoadLocales(a, loader), /Load failed/);
  await safeLoadLocales(a, loader);
  assert.equal(a.t('user:hello'), 'Retry');
});

test('add and load methods retain merge and safe namespace semantics', async () => {
  const a = await instance();
  addLocales(a, {en: {user: {nested: {old: 'Old', value: 'Original'}}}});
  addLocale(a, 'en', 'user', {nested: {value: 'Ignored', added: 'Added'}}, true, false);
  assert.equal(a.t('user:nested.value'), 'Original');
  assert.equal(a.t('user:nested.added'), 'Added');
  await loadLocale(a, 'en', 'user', async () => ({nested: {value: 'Updated'}}));
  assert.equal(a.t('user:nested.value'), 'Updated');
  assert.equal(a.t('user:nested.old'), 'Old');
  safeAddLocale(a, 'en', 'user', {new: 'Ignored'});
  safeAddLocales(a, {en: {user: {new: 'Ignored'}, other: {hello: 'Added'}}});
  assert.equal(a.exists('user:new'), false);
  assert.equal(a.t('other:hello'), 'Added');
});

test('language detection handles SSR, saved preference and inaccessible storage', () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  try {
    delete globalThis.window;
    assert.equal(detectLanguage(), 'zh');
    globalThis.window = {localStorage: {getItem: () => 'en'}};
    globalThis.document = {documentElement: {lang: 'zh'}};
    assert.equal(detectLanguage(), 'en');
    globalThis.window = {
      get localStorage() {
        throw new Error('Storage blocked');
      },
    };
    globalThis.document.documentElement.lang = 'en';
    assert.equal(detectLanguage(), 'en');
    globalThis.document.documentElement.lang = '';
    assert.equal(detectLanguage(), 'zh');
    globalThis.window = {
      localStorage: {
        getItem() {
          throw new Error('Storage blocked');
        },
      },
    };
    assert.equal(detectLanguage(), 'zh');
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else delete globalThis.window;
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
    else delete globalThis.document;
  }
});

function flatten(value, prefix = '') {
  return Object.entries(value).flatMap(([key, item]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return item !== null && typeof item === 'object' ? flatten(item, path) : [[path, item]];
  });
}

test('all registered languages have identical keys and interpolation variables', async () => {
  const baseline = new Map(flatten(resources.zh.translation));
  const placeholders = (value) => [...String(value).matchAll(/\{\{(.*?)\}\}/g)].map((match) => match[1]).sort();
  for (const [lng, namespaces] of Object.entries(localeLoaders)) {
    const translated = new Map(flatten(await namespaces.translation()));
    assert.deepEqual([...translated.keys()].sort(), [...baseline.keys()].sort(), `Keys differ: ${lng}`);
    for (const [key, value] of translated) {
      assert.deepEqual(placeholders(value), placeholders(baseline.get(key)), `Interpolation differs: ${lng}/${key}`);
    }
  }
});
