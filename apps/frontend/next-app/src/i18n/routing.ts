import {defineRouting} from 'next-intl/routing';

import {APP_LOCALES, LOCALE} from './locales';

// defineRouting 的 locales 最终决定应用支持哪些语言 key。
// URL 解析、params.locale、useLocale() 和消息查找得到的都是该列表中的值，
// 例如公开地址 /zh 会被解析为 LOCALE.zhCN 对应的完整 key。
export const locales = APP_LOCALES;

export const defaultLocale = LOCALE.zhCN;

/**
 * 各语言对外展示的 URL 前缀。
 * 修改语言地址时只需更新这里；路由、sitemap 和后续 SEO 配置会共同复用。
 */
export const localePrefixes = {
  [LOCALE.zhCN]: '/zh',
  [LOCALE.zhTW]: '/tw',
  [LOCALE.enUS]: '/en',
} as const;

// defineRouting 是语言配置的运行时生效入口：
// - locales 决定哪些值是合法的语言 key；
// - defaultLocale 决定缺少语言信息时使用哪个 key；
// - localePrefix 决定公开 URL 前缀如何映射到语言 key。
// 该配置还会提供给代理和导航 API，保证 URL 解析与页面跳转使用同一套规则。
export const routing = defineRouting({
  locales,
  defaultLocale,
  // 内部仍使用完整的 locale key，以便翻译、日期和数字格式化保留地区信息；
  // prefixes 只负责缩短用户看到的 URL。
  // next-intl 会将这些公开前缀重写为对应的完整 locale，因此 [locale] 中拿到的仍是完整 key。
  localePrefix: {
    mode: 'always',
    prefixes: localePrefixes,
  },
});
