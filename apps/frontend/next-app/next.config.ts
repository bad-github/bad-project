import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

/**
 * 将 next-intl 接入 Next.js 的构建配置，并明确指定请求配置文件。
 * 插件会让 useTranslations、getTranslations、getMessages 等 API 自动读取
 * src/i18n/request.ts 的默认导出，业务代码不需要手动调用 getRequestConfig。
 */
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.svg': {
        loaders: [
          {
            loader: '@svgr/webpack',
            options: {
              icon: true,
            },
          },
        ],
        as: '*.js',
      },
    },
  },
  /**
   * output 决定 `next build` 生成哪种部署产物：
   *
   * 1. 不配置 output（Next.js 默认模式）
   *    - 产物：`.next/`
   *    - 启动：`next start`
   *    - 场景：Vercel 或常规 Node.js 部署；支持 SSR、ISR、Server Actions、
   *      Route Handlers 等完整的 Next.js 服务端能力。
   *
   * 2. `output: 'standalone'`（当前选择）
   *    - 产物：除常规 `.next/` 外，还生成 `.next/standalone/`，其中包含
   *      最小化的 `server.js` 和运行所需依赖，无需完整安装 node_modules。
   *    - 启动：`node .next/standalone/server.js`
   *    - 场景：Docker、云服务器、自建 Node.js 服务。
   *    - 注意：`public/` 和 `.next/static/` 默认不会复制进 standalone 目录，
   *      独立部署时需要手动复制，或交给 CDN / 反向代理提供。
   *
   * 3. `output: 'export'`
   *    - 产物：`out/` 中的纯 HTML、CSS、JavaScript 等静态文件。
   *    - 启动：无需 Node.js，可由 Nginx、对象存储、GitHub Pages 等直接托管。
   *    - 场景：完全静态的网站或 SPA。
   *    - 限制：不能使用 SSR、ISR、Server Actions、依赖请求信息的 Route
   *      Handlers、cookies，以及默认的 Next.js 图片优化等服务端能力。
   *
   * 本项目保留 standalone：既可部署到 Vercel，也便于本地模拟和学习
   * Docker / 自建服务器部署。
   */
  output: 'standalone',
  cacheComponents: true,
  // Next.js 16.2 需要显式开启；用于在服务端读取根路由的 [locale] 参数。
  experimental: {
    rootParams: true,
  },
  // 工作区工具包由 Next 编译；@badnpm/ui 使用自身已构建的 ESM 产物。
  transpilePackages: ['@workspace/utils'],
  typescript: {
    ignoreBuildErrors: true,
  },

  // 安全地允许来自远程服务器的图片
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
        port: '',
        pathname: '/my-bucket/**',
        search: '',
      },
    ],
  },
  allowedDevOrigins: ['192.168.0.*'],
};

export default withNextIntl(nextConfig);
