# Next.js SEO 清单

本文针对本项目的 Next.js **16.2.6**、App Router、next-intl 多语言路由。本文位于仓库根目录 `docs/seo.md`，项目内路径均相对于 `apps/frontend/next-app`。代码示例是实施方式，不代表已经上线；上线后须在**生产域名**验证。`SITE_URL` 在 Next 应用根目录的 `.env.local` 配置、由 `src/config/site.ts` 读取；变量清单见应用内的 `.env.example`。部署时应在平台配置真实正式域名。

现有基础：`src/app/sitemap.ts` 已生成三语言站点地图，`src/app/robots.ts` 已允许爬虫抓取；`src/config/seo.ts` 和各 `layout.tsx` 已生成标题、描述、canonical、`hreflang`。`/demo` 故意 `noindex` 且不在 sitemap 中，不应因清单而删除。首页目前无 H1，作品集页也缺页面级 H1。

## 1. 在服务端渲染内容

**做法：**App Router 的 `page.tsx` 默认是 Server Component。本项目首页、作品集和技能页已经使用它，`generateStaticParams()` 还会预渲染语言路径。SEO 关键是初始 HTML 包含主要正文，不要求每次请求都动态 SSR。数据读取放在服务端页面；只把交互部分拆为带 `'use client'` 的组件。不要等 `useEffect` 执行后才加载整页正文。

```tsx
// src/app/[locale]/articles/[slug]/page.tsx：新增内容页的示例
import {notFound} from 'next/navigation';

export default async function ArticlePage({params}: {
  params: Promise<{locale: string; slug: string}>;
}) {
  const {locale, slug} = await params;
  const article = await getPublishedArticle(locale, slug); // 接入真实数据源
  if (!article) notFound();
  return <main><h1>{article.title}</h1><article>{article.body}</article></main>;
}
```

部署后 `curl -L https://你的域名/zh`，检查返回 HTML 中是否已有标题及正文。

## 2. 生成站点地图

**现状与做法：**`src/app/sitemap.ts` 已用 `MetadataRoute.Sitemap` 生成 `/sitemap.xml`。新增可索引页面时，把路径加进 `indexableRoutes`，并同步配置页面 metadata；下线页面移除。动态详情页应查询已发布、允许索引的 slug，生成每个语言的绝对 URL。不要列入 404、重定向或 `noindex` 页面。

```ts
// src/app/sitemap.ts 的路由列表中，新增正式页面时增加：
{path: '/articles', priority: 0.7},
```

`lastModified` 仅在掌握真实更新时间时填写，勿每次都写当前时间。检查 `/sitemap.xml` 中每条 URL 返回成功状态且与页面 canonical 一致。站点地图帮助发现页面，不保证收录。[Google 站点地图指南](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)

## 3. 向 Google Search Console 提交站点地图

这是**部署后的平台操作**，不在 Next.js 里编写提交代码。在 [Search Console](https://search.google.com/search-console/) 验证正式域名，进入“站点地图”提交 `https://你的域名/sitemap.xml`，再查看“网页索引”和“URL 检查”。先确认 `SITE_URL` 与验证域名一致。`robots.ts` 已声明 sitemap，但手动提交便于观察处理状态；提交也不保证收录。

## 4. 允许 Googlebot 抓取公开页面

`src/app/robots.ts` 当前 `userAgent: '*'`、`allow: '/'` 已允许 Googlebot。部署后打开 `/robots.txt` 核对实际输出，同时检查 CDN 或代理是否添加了其他阻挡规则。不要设置全站 `disallow: '/'`。若要让爬虫看到某页的 `noindex`，该页必须仍可被抓取，因为 robots 禁止抓取后爬虫看不到 meta 指令。

```ts
// src/app/robots.ts 中现有的关键值
rules: {userAgent: '*', allow: '/'},
sitemap: `${SITE_URL}/sitemap.xml`,
```

## 5. 删除误加的 noindex 标签

只处理**本应收录**的页面。搜索 `robots: {index: false}`、`<meta name="robots">` 及响应头 `X-Robots-Tag`；删除误设值，并确认上游 CDN 未再注入 `noindex`。`src/app/[locale]/demo/page.tsx` 是内部演示，保留其 `index: false`；私有、测试页也不必强行开放收录。用 `curl -I` 查响应头，查看网页源代码及 Search Console URL 检查中的 Google 所见 HTML。[Google noindex 指南](https://developers.google.com/search/docs/crawling-indexing/block-indexing)

## 6. 消除连续跳转

用 `curl -IL https://你的域名/旧路径` 列出每一跳；旧地址应尽量**一次**永久跳至最终规范 URL。排查部署平台、`next.config.ts`、`src/proxy.ts`；本项目 next-intl Proxy 已处理无语言前缀的路径，不要再叠加同类规则。修改后也要把站内链接和 sitemap 改为最终地址。

```ts
// next.config.ts：仅在确有此旧路径时新增
async redirects() {
  return [{source: '/old-portfolio', destination: '/zh/portfolio', permanent: true}];
},
```

如果站点还通过 CDN 强制 HTTPS，旧路径的源地址应尽量由 CDN 直接指向 HTTPS 下的最终目标，避免“先换协议、再换路径”的链条。

## 7. 修复失效链接和错误的 404

从 Search Console、访问日志和站内链接中找出失效 URL。本应存在的页面恢复页面或修正链接；已迁移且有对应内容的页面设单跳永久重定向；确已删除且无替代内容的页面保持真实 404，勿全部跳首页。动态路由找不到数据时用 `notFound()`，本项目已有 `src/app/[locale]/not-found.tsx`。

```tsx
import {notFound} from 'next/navigation';
if (!article) notFound();
```

此外，核对首页、作品集和页脚中的 `href="#"` 占位链接，改成真实目标或移除。检查 HTTP 状态，避免“页面说不存在、响应却是 200”的软 404。

## 8. 添加规范网址标签

**现状：**`src/config/seo.ts` 的 `createPageAlternates()` 已生成 canonical；布局通过 `createLocalizedMetadata()` 使用它。新页面应复用这套函数，同时提供自己的路径和翻译命名空间，不要手写 `<link>`。例如新增文章列表页，在其布局导出 `createLocalizedMetadata('/articles', 'Articles')`，并先扩展 `SeoNamespace` 与多语言消息。

每个语言页应指向**自身的规范语言 URL**；`/en/portfolio` 不应 canonical 到 `/zh/portfolio`。语言关系交给 `hreflang`。统一 `SITE_URL`、协议、域名、尾斜杠和 sitemap。canonical 是搜索引擎的提示，不保证被采纳。[Google canonical 指南](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)

## 9. 为每个可索引页面写独立的摘要描述

`src/config/seo.ts` 从语言消息中的 `metadata.description` 生成 `<meta name="description">`。新增正式页面时，在 `src/i18n/messages/zhCN`、`zhTW`、`enUS` 的对应模块分别填写具体、准确、与正文相符的描述。不要把同一句品牌口号复制到全站，也不要堆关键词。

```ts
// 对应页面的中文消息模块示意
metadata: {
  title: '作品集｜真实姓名',
  description: '查看我参与的前端项目、技术选择和实际成果。',
},
```

以生产页面源代码核验。Google 可能按搜索词改写摘要，故 meta description 不保证原样展示；`demo` 等不收录页面也无需为了勾选清单编造描述。

## 10. 每页设置一个清晰的 H1 主标题

这是便于读者和爬虫理解结构的建议，并非“多于一个 H1 就无法收录”的硬规则。本项目首页只有“关于我”的 H2；应在 `src/app/[locale]/page.tsx` 的 `<main>` 内补可见 H1。作品集页有分区 H2/H3，也应补页面级 H1。技能和展示页已有 H1。

```tsx
<main>
  <h1 className="text-3xl font-semibold">{t('pageTitle')}</h1>
  {/* 原有页面内容；分区标题继续用 H2 */}
</main>
```

同步在三种语言的 `home.ts` 中加入真实 `pageTitle` 翻译，不要放隐藏的关键词标题。

## 11.  为真实问答添加 FAQ 结构化数据

**重要时效信息：**Google 已在 2026 年停止展示 FAQ 富媒体搜索结果，因此不应把它当作获取 FAQ 搜索展示的手段。[Google 更新记录](https://developers.google.com/search/updates) 只有页面本来有对读者有用、可见的问答时，才考虑添加 Schema.org `FAQPage`，并保持结构化数据与可见内容一致。

```tsx
// 放在展示同一组 faqs 的 Server Component 页面中
const faqs = [{question: '如何联系你？', answer: '可通过页面中的邮箱联系。'}];
const jsonLd = {
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faqs.map(({question, answer}) => ({
    '@type': 'Question', name: question,
    acceptedAnswer: {'@type': 'Answer', text: answer},
  })),
};

return <main>
  <h1>常见问题</h1>
  {faqs.map(({question, answer}) =>
    <section key={question}><h2>{question}</h2><p>{answer}</p></section>)}
  <script type="application/ld+json"
    dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd).replace(/</g, '\\u003c')}} />
</main>;
```

三种语言页使用各自可见的问答。转义 `<` 可防止内容破坏 `<script>` 标签。[Next.js JSON-LD 指南](https://nextjs.org/docs/app/guides/json-ld)

## 12.添加面包屑导航

仅在确有层级时提供，例如“首页 → 作品集 → 项目详情”；首页无须添加。使用 `src/i18n/navigation.ts` 提供的 `Link`，让链接自动遵循语言路由，并为当前项设置 `aria-current="page"`。

```tsx
import {Link} from '@/i18n/navigation';

<nav aria-label="面包屑导航"><ol>
  <li><Link href="/">首页</Link></li>
  <li><Link href="/portfolio">作品集</Link></li>
  <li aria-current="page">项目名称</li>
</ol></nav>
```

若加 `BreadcrumbList` JSON-LD，用当前语言的绝对规范 URL 构造 `itemListElement`；`position` 从 1 开始，名称及顺序与页面可见导航一致。[Google 面包屑文档](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)

## 13.为孤立页面添加站内链接

孤立页是有 URL 却没有其他站内页面链接到它的页面。核对 `src/components/header/menu-items.ts`、页脚和相关正文；对重要页面提供可抓取的 `<Link href="/portfolio">作品集</Link>`，不要只依赖 `onClick` 导航、搜索框或 sitemap。把 sitemap 的 URL 与站内爬取结果对照，尤其检查新文章、项目详情和各语言版本。链接文字应说明目标内容。

## 14.为每张图片设置合适的替代文本

有信息量的图片用 `alt` 描述**实际传达的内容**；纯装饰图用 `alt=""`。本项目多数 `next/image` 已有 `alt`，但作品集预览的 `previewPlaceholder` 是否具体、页眉 `Kitty logo` 是否准确及需否翻译，应逐项核对。也要检查原生 `<img>`、Markdown 和 CMS 图片。

```tsx
<Image src={preview} alt="React 管理后台仪表盘截图" sizes="(max-width: 767px) 100vw, 68vw" />
<Image src={decoration} alt="" aria-hidden="true" />
```

不要堆关键词。若图片是链接内唯一内容，`alt` 应说明链接目的。

## 15.使用 WebP 等现代图片格式

优先继续使用 `next/image`，它可在生产环境按请求优化图片并协商现代格式；不必强制把每个源 PNG/JPEG 手动转成 WebP。检查部署后优化图片响应的 `Content-Type` 和实际文件大小。若改成静态导出、远程 CDN 或自定义 loader，需要确认该链路是否仍提供现代格式。

```tsx
import Image from 'next/image';
import Preview from '@/assets/image/react-admin-preview-light.png';

<Image src={Preview} alt="项目界面预览" sizes="(max-width: 767px) 100vw, 68vw" />;
```

含小字的截图应比较转换后的清晰度；压缩过大的源图也有益。[Next.js 图片文档](https://nextjs.org/docs/app/api-reference/components/image)

## 16.修复布局偏移

先在 PageSpeed Insights 或 Chrome DevTools 定位跳动元素。为图片保留宽高；`fill` 图片的父容器给定固定高度或比例；为异步内容预留空间；避免首屏上方临时插入内容。本项目 `layout.tsx` 已用 `next/font`，作品集 `fill` 预览的父容器已有高度，应继续保持。

```tsx
<Image src="/cover.webp" alt="项目封面" width={1200} height={675}
  sizes="(max-width: 767px) 100vw, 50vw" />
```

以真实用户数据第 75 百分位 **CLS ≤ 0.1** 为目标，并检查移动端。[Google Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals)

## 17.尽量在 2 秒内呈现主要内容

“整页 2 秒内全部加载”不是 Google 的统一 SEO 门槛。更可测的目标是第 75 百分位 **LCP ≤ 2.5 秒、INP ≤ 200 毫秒、CLS ≤ 0.1**；2 秒可作为更严格的内部首屏目标。[Google Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals)

先测再改：保持正文在 Server Component；首屏关键图片给合适的 `sizes` 和 `fetchPriority="high"`，其余图片保持延迟加载；缩小客户端组件及第三方脚本；慢数据请求按更新频率缓存。Next.js 16 的缓存要结合本项目 `cacheComponents` 与数据需求验证，不要盲目缓存。用 `pnpm --filter next-app build`、PageSpeed Insights 和 Search Console 真用户报告复测。

## 18.清理空泛、重复或不真实的 AI 式内容

这是内容编辑，不能靠一个 SEO 插件完成。逐页核对事实、项目成果、截图、技术选择和日期；删掉重复套话、无依据的夸大描述、占位 FAQ 与无效链接。作品集应写明自己实际负责的部分、遇到的问题、技术决策及结果。三语言文案也需人工校对。AI 辅助写作本身不是问题；批量生产缺乏原创价值、为操纵排名而写的内容有风险。[Google 有用内容指南](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)

先审查 `src/i18n/messages/{zhCN,zhTW,enUS}/` 的主页及作品集文案、`portfolio/page.tsx` 中的占位项目和 `href="#"`。

## 19. 添加真实作者简介

首页已有人名、经历与自述；核实信息真实性，补充真实的职责、经历、可验证的作品和联系方式。文章或案例页可显示署名、更新时间，并链接到个人简介页；普通作品卡片无需机械地加署名。若复用作者数据，可集中在 `src/config/author.ts`：

```ts
export const author = {
  name: '真实姓名',
  role: '前端工程师',
  bio: '真实项目经历与专业领域的简短介绍。',
  profileUrl: '/zh',
};
```

可以用 `<a rel="author">` 链接简介页；文章 `Article` JSON-LD 的 `author.name` 应与可见署名一致。不要编造学历、职位或人物头像。[Google 关于作者的建议](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)

## 20. 获取高质量、相关的外部链接

这是站外合作和内容传播，**不能靠 Next.js 代码自动生成**。先发布值得引用的真实案例、开源项目、技术文章或独特资料，并保持稳定 URL；再从相关 GitHub 仓库、本人资料、合作方页面或社区内容自然链接到对应页面。用 Search Console“链接”报告观察来源、相关性与实际引荐流量。不要购买链接、交换链接农场或群发垃圾投稿；旧 URL 迁移时保留单跳重定向，避免已有外链失效。[Google 链接垃圾政策](https://developers.google.com/search/docs/essentials/spam-policies#link-spam)

## 推荐验收顺序

1. 配置正式 `SITE_URL`；核验 `/robots.txt`、`/sitemap.xml`、canonical、误设 noindex、404 和跳转链。
2. 补首页及作品集 H1；检查三语言描述、图片 alt、站内入口、作者资料与占位内容。
3. 实测 LCP/INP/CLS；只有存在真实 FAQ 或层级导航时才考虑对应结构化数据。
4. 上线后用 `curl -I` 查状态及响应头、`curl -L` 查 HTML；在 Search Console 提交 sitemap，并抽样检查 `/zh`、`/tw/portfolio`、`/en/skill`、`/zh/demo`。

参考：[Next.js Metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)、[Next.js sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)、[Google SEO 基础](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)。
