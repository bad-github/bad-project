import type {LocaleLoaders} from '../types';

/**
 * 内置语言加载器；注册时不会执行 import，只在需要对应语言时加载。
 * 新增语言时，在这里注册相同结构的命名空间即可。
 * @example
 * import {createI18n} from '@workspace/i18n';
 * import {localeLoaders} from '@workspace/i18n/locales';
 * const {i18n, ready} = createI18n({loaders: localeLoaders, lng: 'zh'});
 * await ready;
 * await i18n.changeLanguage('en'); // 此时才加载英文（除非英文已作为回退语言加载）。
 */
export const localeLoaders = {
  en: {translation: () => import('./en-us').then((m) => m.default)},
  zh: {translation: () => import('./zh-cn').then((m) => m.default)},
} satisfies LocaleLoaders;
