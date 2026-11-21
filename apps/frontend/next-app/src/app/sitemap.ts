import type {MetadataRoute} from 'next';
import {createLanguageAlternates} from '@/config/seo';
import {SITE_URL} from '@/config/site';
import {localePrefixes} from '@/i18n/routing';

/**
 * Next.js 的特殊 Metadata Route。
 * 该源码文件不会渲染普通页面；部署后 Next.js 会把返回的页面列表转换为：https://正式域名/sitemap.xml
 *
 * sitemap.xml 相当于提供给搜索引擎的网站目录。每个 url 表示一个希望被发现、抓取并参与搜索结果的正式页面。
 * 这里会组合正式域名、语言前缀和页面路径，因而最终包含简体中文、繁体中文和英文三个版本。
 */

/**
 * 希望搜索引擎收录的公开页面。
 * 以后增加新的正式页面时，需要在这里补充路径；实验页、登录页等不应加入。
 * priority 是站内相对重要程度：首页最高，作品集和技能页依次降低；
 * 它只是提供给搜索引擎的参考，并不能保证搜索排名。
 */
const indexableRoutes = [
  {path: '', priority: 1},
  {path: '/portfolio', priority: 0.9},
  {path: '/skill', priority: 0.8},
] as const;

/**
 * Next.js 约定 sitemap.ts 必须默认导出一个返回 Sitemap 数据的函数，
 * 框架才会调用它并生成 /sitemap.xml。
 * 函数名在语法上可以不是 sitemap，但沿用官方命名更容易辨认和维护。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // ['/zh', '/tw', '/en']
  return Object.values(localePrefixes).flatMap((localePrefix) =>
    indexableRoutes.map(({path, priority}) => ({
      // 需要搜索引擎发现和索引的规范 URL，只放公开且返回成功状态的页面。
      url: `${SITE_URL}${localePrefix}${path}`,
      // 在 sitemap.xml 中同步声明同一页面的三种语言版本及默认版本。例如/zh/portfolio、/tw/portfolio、/en/portfolio是同一页面的不同语言版本。
      // 它与页面 <head> 中的 hreflang 含义相同，帮助搜索引擎关联多语言页面。
      alternates: {languages: createLanguageAlternates(path)},
      // 内容预期更新频率，是给爬虫的提示，并不保证按此抓取。
      changeFrequency: 'monthly' as const,
      // 站内 URL 的相对优先级提示，不会直接提高搜索排名。
      priority,
    })),
  );
}


// 大型网站可通过 generateSitemaps 拆分多个 sitemap，避免单文件超过搜索引擎限制。
