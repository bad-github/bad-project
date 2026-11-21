This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

Vercel 本地预构建部署步骤见 [部署文档](./vercel-deploy.md)。

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## TODO

- [ ] 处理切换语言时 `next-themes` 产生的 `<script>` 客户端渲染警告。
  - 当前环境：Next.js 16.2、React 19、`next-themes` 0.4.6。
  - 触发方式：使用 `next-intl` 的 `router.replace(pathname, {locale})` 切换 `[locale]` 后，相关布局重新渲染。
  - 原因：`ThemeProvider` 内部会渲染用于避免主题闪烁的 `<script>`；React 在客户端重新渲染该脚本时提示 `Encountered a script tag while rendering React component`。
  - 当前决定：暂不修改，继续保留客户端语言切换。
  - 后续方案：优先升级到已修复此问题的 `next-themes` 版本；若长期未修复，可暂时改用 `window.location.replace()` 进行完整页面导航，并保留查询参数和 URL hash。
  - 跟踪问题：[next-themes #385](https://github.com/pacocoursey/next-themes/issues/385)。

## 服务端客户端组件

推荐写法

| 类型                         | Server Component  | Client Component         |
| ---------------------------- | ----------------- | ------------------------ |
| 运行位置                     | Node.js 服务端    | 浏览器                   |
| 默认类型                     | ✔                 | ❌（必须 `"use client"`） |
| 是否能交互                   | ❌                 | ✔                        |
| 是否能 useState              | ❌                 | ✔                        |
| 是否能 useEffect             | ❌                 | ✔                        |
| 是否能访问数据库             | ✔                 | ❌                        |
| 是否能访问浏览器 API         | ❌                 | ✔                        |
| 是否能减少 bundle            | ✔                 | ❌                        |
| 是否适合 SEO                 | ✔                 | 一般                     |
| 是否可直接读取 cookie/header | ✔（next/headers） | ❌                        |
| 是否能绑定 onClick           | ❌                 | ✔                        |



服务端组件传递给客户端组件的 props 必须是可序列化的

| 类型               | 是否可序列化  | 是否可作为 Server → Client Props | 示例              | 说明                           |
| ------------------ | ------------- | -------------------------------- | ----------------- | ------------------------------ |
| string             | ✔             | ✔                                | `'hello'`         | 最基础类型                     |
| number             | ✔             | ✔                                | `123`             | 支持                           |
| boolean            | ✔             | ✔                                | `true`            | 支持                           |
| null               | ✔             | ✔                                | `null`            | 支持                           |
| undefined          | ✔             | ✔                                | `undefined`       | React Flight 支持              |
| bigint             | ⚠️             | ❌（通常不建议）                  | `123n`            | JSON 不支持，RSC兼容有限       |
| object（普通对象） | ✔             | ✔                                | `{ name: 'Tom' }` | 最常用                         |
| array              | ✔             | ✔                                | `[1, 2, 3]`       | 支持                           |
| Date               | ✔（特殊处理） | ✔                                | `new Date()`      | React 会特殊编码               |
| URL                | ⚠️             | 不推荐                           | `new URL(...)`    | 可能丢失原型                   |
| RegExp             | ❌             | ❌                                | `/abc/`           | 无法安全恢复                   |
| function           | ❌             | ❌                                | `() => {}`        | 无法跨网络传输                 |
| class instance     | ❌             | ❌                                | `new User()`      | prototype 会丢失               |
| Promise            | ❌             | ❌                                | `fetch()`         | 不能作为 props                 |
| Symbol             | ❌             | ❌                                | `Symbol()`        | 无法序列化                     |
| Map                | ❌             | ❌                                | `new Map()`       | JSON 不支持                    |
| Set                | ❌             | ❌                                | `new Set()`       | JSON 不支持                    |
| WeakMap            | ❌             | ❌                                | `new WeakMap()`   | 不可遍历                       |
| WeakSet            | ❌             | ❌                                | `new WeakSet()`   | 不可遍历                       |
| DOM 元素           | ❌             | ❌                                | `document.body`   | 浏览器对象                     |
| File               | ⚠️             | 通常不行                         | `new File()`      | 需特殊上传处理                 |
| Blob               | ⚠️             | 通常不行                         | `new Blob()`      | 不建议直接传                   |
| Error              | ⚠️             | 不推荐                           | `new Error()`     | stack/message 不稳定           |
| React Component    | ❌             | ❌                                | `<Comp />`        | 组件不是数据                   |
| JSX Element        | ⚠️             | 特殊情况                         | `<div />`         | React 内部处理，不算普通 props |
| ReactNode          | ⚠️             | 部分支持                         | `children`        | React 特殊协议支持             |





  **App Router里“一个路由文件夹”能放的特殊文件**
  - page.tsx / page.jsx / page.js：这个路由真正对外展示的页面，通常是必须的
  - layout.tsx / layout.jsx / layout.js：包住当前段及其子页面的布局，会持续存在，导航时尽量保留状态
    - 导航栏
    - 侧边栏
    - 需要保留的 UI 状态
  - template.tsx / template.jsx / template.js：和 layout 类似，但每次导航会重新挂载，常用于重置状态
    - 希望每次导航都重置的表单
    - useEffect 需要每次重新执行的场景
    - 你想强制刷新子树状态的地方
  - loading.tsx / loading.jsx / loading.js：加载态，占位 UI
  - error.tsx / error.jsx / error.js：当前路由段的错误边界，必须是 Client Component
  - not-found.tsx / not-found.jsx / not-found.js：当前路由段的 404 UI
  - default.tsx / default.jsx / default.js：并行路由的兜底页面
  - route.ts / route.js：Route Handler，不是页面，而是接口/请求处理
  - global-error.tsx / global-error.jsx / global-error.js：全局错误页
  - global-not-found.tsx / global-not-found.jsx / global-not-found.js：全局 404，偏实验性



    1. Server Actions / Server Functions
     这是 App Router 里非常核心的一块。建议加一个 /docs/getting-started/mutating-data：
      - use server
      - <form action={serverAction}>
      - useActionState
      - useFormStatus
      - Server Action 中做鉴权校验
      - action 后 redirect()、revalidatePath()、updateTag()
  2. Cache Components / use cache
     Next 16 文档重点已经转向 cacheComponents 模型。你现在没有集成：
      - next.config.ts 中 cacheComponents: true
      - 'use cache'
      - cacheLife
      - cacheTag
      - revalidateTag
      - updateTag
      - revalidatePath
      - connection() 处理 request-time 数据
      - unstable_instant 处理即时导航
  3. Metadata / SEO / OG
     现在只有根布局静态 metadata，Head 页面也只是空示例。App Router 应重点展示：
      - 静态 metadata
      - 动态 generateMetadata
      - generateViewport
      - opengraph-image.tsx
      - twitter-image.tsx
      - robots.ts
      - sitemap.ts
      - ImageResponse
  4. Proxy
     Next 16 中 Middleware 已改名为 Proxy。建议新增：
      - src/proxy.ts
      - config.matcher
      - rewrite
      - redirect
      - request/response header 修改
      - 简单鉴权跳转示例
        注意：不要再用旧知识里的 middleware.ts 作为主示例。
  5. Route Groups / Intercepting Routes
     你有并行路由，但还缺两个 App Router 重要路由能力：
      - (marketing) / (dashboard) route group
      - intercepting routes：(.)、(..)、(...)
      - modal route 场景，例如列表页点开详情弹 modal，刷新后落到完整详情页
  6. unauthorized / forbidden
     Next 文档里已有 unauthorized.tsx、forbidden.tsx 约定和函数：
      - unauthorized()
      - forbidden()
      - unauthorized.tsx
      - forbidden.tsx
        适合和 auth 示例放一起。
  7. next/form、next/script
     你的 Components 目录目前 Image 和 Head 页面基本是占位。建议补：
      - next/image：本地图片、远程图片、fill、sizes、priority、placeholder
      - next/script：不同 strategy
      - next/form：搜索表单、导航行为、Server Action 对比
  8. 环境变量 / 配置
     适合补到 Configuration：
      - .env.local
      - NEXT_PUBLIC_*
      - server-only env
      - build-time vs runtime env
      - redirects
      - rewrites
      - headers
      - basePath 当前也是占位，建议做可运行示例或明确说明限制
  9. Instrumentation / Web Vitals / Analytics
     生产化知识点里比较重要：
      - instrumentation.ts
      - instrumentation-client.ts
      - useReportWebVitals
      - after()
      - logging / tracing 的位置边界
  10. 高级 Route Handler

     当前 Route Handler 主要是 JSON GET/POST。建议补：

  - 设置 cookie
  - redirect response
  - streaming response
  - file upload / FormData
  - Edge runtime 示例
  - cache behavior under cacheComponents

  我建议的集成顺序

  1. 先补 mutating-data：Server Actions + Form + revalidate。
  2. 再补 caching：Next 16 的 cacheComponents、use cache、tag revalidation。
  3. 然后补 metadata：动态 SEO、OG、sitemap、robots。
  4. 最后补 proxy、route groups、intercepting routes、auth/unauthorized/forbidden。


## 环境变量

所有应用环境变量在根目录 [`.env.example`](./.env.example) 登记；`SITE_URL` 由 [`src/config/site.ts`](./src/config/site.ts) 读取。新增变量时同步更新清单和对应的读取代码。本地把实际值写入被 Git 忽略的 `.env.local`，例如 `SITE_URL=https://你的正式域名`；生产环境在部署平台配置同名变量。修改后重新构建并部署，让 sitemap、robots 和 canonical 使用新域名。`SITE_URL` 不需 `NEXT_PUBLIC_`，因为仅服务端使用。

## 本地部署

### standalone

**需要关注的文件**

| 文件/目录                                                    | 用途                                      | 是否部署                                 |
| ------------------------------------------------------------ | ----------------------------------------- | ---------------------------------------- |
| [package.json](/Users/gych/D/code/bad-project/apps/frontend/next-app/package.json) | 构建、启动脚本和依赖版本                  | 普通模式需要；standalone 已包含运行依赖  |
| [next.config.ts](/Users/gych/D/code/bad-project/apps/frontend/next-app/next.config.ts) | Next.js 构建配置；当前启用了 `standalone` | 只在构建时使用                           |
| `.env.local` / 部署平台环境变量                                | `SITE_URL` 等业务配置；变量清单见 `.env.example` | 本地文件不提交；生产环境须配置 |
| `public/`                                                    | 直接通过 `/文件名` 访问的静态文件         | 需要复制                                 |
| `.next/static/`                                              | 浏览器使用的 JS、CSS、字体、图片          | 必须复制                                 |
| `.next/standalone/`                                          | 最小生产运行环境、依赖和服务端代码        | 必须整体部署                             |
| `.next/standalone/apps/frontend/next-app/server.js`          | 实际生产服务入口                          | 唯一需要执行的文件                       |
| `.next/server/`                                              | SSR、RSC、路由服务端产物                  | standalone 中已有精简副本                |
| `.next/BUILD_ID`                                             | 保证服务端和静态资源属于同一次构建        | 不手动操作                               |
| `.next/cache/`、`.next/dev/`、`.next/types/`、诊断文件       | 缓存、开发和类型产物                      | 不需要单独部署                           |

#### 1. 重新构建

```
cd /Users/gych/D/code/bad-project/apps/frontend/next-app

pnpm build
```

#### 2. 把 `public` 复制到 standalone 应用目录

因为这是 monorepo，入口位于嵌套目录：

```
cp -R public .next/standalone/apps/frontend/next-app/
```

#### 3. 复制浏览器静态资源

```
mkdir -p .next/standalone/apps/frontend/next-app/.next

cp -R .next/static \
  .next/standalone/apps/frontend/next-app/.next/
```

最终关键结构应为：

```
.next/standalone/
├── node_modules/
└── apps/frontend/next-app/
    ├── server.js
    ├── public/
    ├── node_modules/
    └── .next/
        ├── static/
        ├── server/
        └── BUILD_ID
```

#### 4. 启动服务

注意要保留整个 `.next/standalone`，不能只复制其中的 `next-app` 目录，因为部分依赖位于顶层 `node_modules`。

```
cd .next/standalone

PORT=3000 \
HOSTNAME=0.0.0.0 \
node apps/frontend/next-app/server.js
```

然后访问：

```
http://localhost:3000
```

后台长期运行时可以交给 PM2、systemd 或 Docker 管理。

#### 5. 打包后复制到其他目录

```
cd .next/standalone

tar -czf ../../next-app-standalone.tgz .
```

部署机器解压后运行：

```
tar -xzf next-app-standalone.tgz

PORT=3000 HOSTNAME=0.0.0.0 \
node apps/frontend/next-app/server.js
```