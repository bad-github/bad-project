/**
 * locale 字符串的唯一声明位置，用于避免在各模块重复书写语言标识。
 *
 * 注意：这里仅定义可复用的常量，并不会让某个 locale 自动生效。
 * 应用运行时实际支持哪些语言，由 routing.ts 中传给 defineRouting 的 locales 决定。
 */
export const LOCALE = {
  zhCN: 'zh-CN',
  zhTW: 'zh-TW',
  enUS: 'en-US',
} as const;

export type AppLocale = (typeof LOCALE)[keyof typeof LOCALE];

// 该列表会传给 defineRouting，列表中的值才是 next-intl 运行时使用的语言 key。
export const APP_LOCALES = [LOCALE.zhCN, LOCALE.zhTW, LOCALE.enUS] as const;
