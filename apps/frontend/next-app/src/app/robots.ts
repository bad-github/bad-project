import type {MetadataRoute} from 'next';
import {SITE_URL} from '@/config/site';

/**
 * Next.js 的特殊 Metadata Route。
 * 该源码文件不会成为普通页面；部署后 Next.js 会把返回值自动转换为：
 * https://正式域名/robots.txt
 *
 * robots.txt 是提供给 Googlebot、Bingbot 等搜索引擎爬虫的访问说明。
 * - rules 决定哪些路径允许或禁止抓取；
 * - sitemap 告诉爬虫网站地图的位置；
 * - host 声明本站希望使用的正式域名。
 *
 * 注意：允许抓取不代表页面一定会被收录，最终是否收录仍由搜索引擎决定。
 * Next.js 约定 robots.ts 必须默认导出返回 Robots 数据的函数，框架才会生成
 * /robots.txt。函数名本身可以不同，但使用 robots 与官方文档保持一致。
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      // 谷歌和必应爬虫
      // userAgent: ['Googlebot', 'Bingbot']
      // `*` 表示这些规则适用于所有搜索引擎爬虫。
      userAgent: '*',
      // 允许爬虫从网站根路径开始访问公开内容。
      allow: '/',
      // Demo 的“不收录”由页面级 noindex 控制；这里仍允许抓取，确保爬虫能读取该指令。
      // disallow: ['/zh/demo', '/tw/demo', '/en/demo'],
    },
    // 向爬虫声明站点地图地址，爬虫可以通过它发现所有正式页面。
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
