import createMiddleware from 'next-intl/middleware';

import {routing} from './i18n/routing';

/**
 * proxy.ts: 是 Next.js 的请求入口文件，匹配到的请求在页面渲染前先经过它
 * 一般在需要根据请求内容、在渲染前决定重定向、重写路径或设置请求头时使用它
 * 能用 `redirects`、`rewrites`、Server Component 或 Route Handler 解决时，不必滥用 Proxy
 
 */

/**
 * createMiddleware 根据 routing 生成国际化请求处理器。
 * Next.js 16 会自动识别 src/proxy.ts，并在符合下方 matcher 的请求进入页面前调用它，
 * 因此业务代码不需要手动执行该函数。
 *
 * 该处理器负责：
 * - 从 URL、语言 Cookie 和 Accept-Language 请求头中识别语言；
 * - 将没有语言前缀的地址重定向到默认语言的规范地址；
 * - 把当前语言传递给后续的国际化路由和服务端渲染流程。
 */
export default createMiddleware(routing);

export const config = {
  // 跳过 API、Next.js 内部资源、Vercel 内部资源以及包含扩展名的静态文件。
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
