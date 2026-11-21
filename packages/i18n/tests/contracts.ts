import {createI18n, loadLocale, loadLocales} from '../src';
import {resources} from '../src/resources';
import {localeLoaders} from '../src/locales';
import type {SupportedLang, LocaleResource, CreateI18nOptions} from '../src';

// 只检查公共类型，不执行，也不进入构建产物。
export function checkI18nContracts() {
  'en' satisfies SupportedLang;
  'zh' satisfies SupportedLang;
  // @ts-expect-error 内置语言类型不能扩大为任意字符串。
  'unknown-language' satisfies SupportedLang;
  resources.en.translation.notify.viewAll satisfies string;
  const resource = {hello: 'Hello', nested: {list: ['first', 'second']}} satisfies LocaleResource;
  const options = {
    lng: 'fr',
    fallbackLng: false,
    defaultNS: 'custom',
    supportedLngs: ['fr'],
    resources: {fr: {custom: resource}},
  } satisfies CreateI18nOptions;
  const {i18n, ready} = createI18n(options);
  ready satisfies Promise<unknown>;
  loadLocale(i18n, 'fr', 'user', async () => resource) satisfies Promise<void>;
  loadLocales(i18n, async () => resources) satisfies Promise<void>;
  createI18n({loaders: localeLoaders, lng: 'zh'});
  // @ts-expect-error 初始化必须显式选择资源来源。
  createI18n();
  // @ts-expect-error 语言包不支持函数值。
  createI18n({resources: {en: {translation: {hello: () => 'Hello'}}}});
}
