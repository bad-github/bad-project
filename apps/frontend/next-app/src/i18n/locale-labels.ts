import {LOCALE, type AppLocale} from './locales';

/**
 * 把 locale 映射到 Common 翻译模块中的语言名称键，供不同样式的语言选择器复用。
 */
export const languageLabelKeys = {
  [LOCALE.zhCN]: 'languages.zhCN',
  [LOCALE.zhTW]: 'languages.zhTW',
  [LOCALE.enUS]: 'languages.enUS',
} as const satisfies Record<AppLocale, string>;
