import {createNavigation} from 'next-intl/navigation';

import {routing} from './routing';

/**
 * createNavigation 根据统一的 routing 配置包装 Next.js 导航 API。
 * 业务组件应从本文件导入这些 API，使站内跳转自动保留或切换当前语言前缀，
 * 例如在英文页面中使用 <Link href="/skill" /> 会自动生成带英文前缀的地址。
 *
 * 这些成员由 createNavigation 创建，无需在业务代码中手动拼接 locale：
 * - Link：声明式站内链接；
 * - redirect：服务端重定向；
 * - usePathname：获取不包含语言前缀的当前站内路径；
 * - useRouter：客户端导航及语言切换；
 * - getPathname：在非组件代码中生成本地化路径。
 */
export const {Link, redirect, usePathname, useRouter, getPathname} = createNavigation(routing);
