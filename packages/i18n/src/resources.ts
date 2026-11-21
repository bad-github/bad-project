import zh from './locales/zh-cn';
import en from './locales/en-us';
import type {LocaleResources} from './types';

/**
 * 全量资源入口，适用于主动选择一次加载所有文案的场景。
 * 按需加载应用应使用 @workspace/i18n/locales 中的 localeLoaders。
 * @example
 * import {resources} from '@workspace/i18n/resources';
 * const {i18n, ready} = createI18n({resources, lng: 'zh'});
 * await ready;
 */
export const resources = {
  en: {translation: en},
  zh: {translation: zh},
} satisfies LocaleResources;
