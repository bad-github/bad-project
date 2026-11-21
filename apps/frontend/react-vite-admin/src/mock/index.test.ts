import {beforeEach, expect, test, vi} from 'vitest';

const state = vi.hoisted(() => ({
  i18n: {language: 'en', resolvedLanguage: undefined as string | undefined},
  ready: Promise.resolve(),
}));

vi.mock('../i18n', () => ({
  i18n: state.i18n,
  get ready() {
    return state.ready;
  },
}));

import {getMock} from './index';

beforeEach(() => {
  state.ready = Promise.resolve();
  state.i18n.language = 'en';
  state.i18n.resolvedLanguage = undefined;
});

test('waits for i18n initialization before selecting the current language', async () => {
  let release!: () => void;
  state.ready = new Promise((resolve) => {
    release = resolve;
  });
  let completed = false;
  const pending = getMock().then((mock) => {
    completed = true;
    return mock;
  });
  await Promise.resolve();
  expect(completed).toBe(false);
  state.i18n.resolvedLanguage = 'zh-CN';
  release();
  expect((await pending).faker.getMetadata().code).toBe('zh_CN');
});

test('explicit language and generation options override UI language', async () => {
  state.i18n.resolvedLanguage = 'zh-CN';
  const options = {language: 'en', seed: 42, refDate: '2026-01-01T00:00:00Z'};
  const [a, b] = await Promise.all([getMock(options), getMock(options)]);
  expect(a.faker.getMetadata().code).toBe('en');
  expect(a.user.getAll(3)).toEqual(b.user.getAll(3));
  expect(a.user.getTree(2, 1)).toEqual(b.user.getTree(2, 1));
  expect(a.faker).not.toBe(b.faker);
});

test('each request creates a separate scene with the migrated entities', async () => {
  const options = {seed: 42, refDate: '2026-01-01T00:00:00Z'};
  const [a, b, control] = await Promise.all([getMock(options), getMock(options), getMock(options)]);
  a.faker.seed(999);
  expect(b.sortItem.getAll(2)).toEqual(control.sortItem.getAll(2));
  expect(b.notification.getAll(2)).toEqual(control.notification.getAll(2));
});
