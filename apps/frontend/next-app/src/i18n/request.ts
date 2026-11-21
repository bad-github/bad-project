import * as rootParams from 'next/root-params';
import {hasLocale} from 'next-intl';
import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

import {messages} from './messages';
import {routing} from './routing';

/**
 * getRequestConfig 用于声明每次服务端请求所使用的国际化配置。
 *
 * 接入 next-intl 的 Next.js 插件后，框架会自动找到并执行本文件的默认导出，
 * 业务代码不需要手动调用它。useTranslations、getTranslations、getMessages
 * 等 API 会读取这里返回的配置。
 *
 * 回调必须返回 RequestConfig。本项目至少提供：
 * - locale：本次请求最终使用的语言；
 * - messages：该语言完整的翻译消息对象。
 *
 * 回调参数中的 locale 来自 getTranslations({locale}) 等显式调用；没有显式值时，
 * 本项目从 URL 根路由的 [locale] 参数中读取并校验语言。
 */
export default getRequestConfig(async ({locale}) => {
  // 显式调用 getTranslations({locale}) 时优先使用传入值；否则从根路由的 [locale] 参数读取。
  const requestedLocale = locale ?? (await rootParams.locale());

  if (!hasLocale(routing.locales, requestedLocale)) {
    notFound();
  }

  return {
    locale: requestedLocale,
    // 直接读取 TypeScript 模块，不需要在运行时加载或合并 JSON 文件。
    messages: messages[requestedLocale],
  };
});
