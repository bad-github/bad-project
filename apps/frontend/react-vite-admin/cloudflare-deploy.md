# Admin 部署到 Cloudflare Workers

与 Vercel 共用 `dist/g/` 构建产物，访问路径保持 `/g/`。
Vercel 配置和原命令继续保留，Cloudflare 使用 `wrangler.jsonc` 和 `cloudflare/worker.ts`。

## 首次部署

从仓库根目录执行：

```bash
pnpm install --frozen-lockfile
pnpm dlx wrangler@latest login
```

在 `wrangler.jsonc` 中设置：

- `name`：Cloudflare Worker 名称，默认 `react-vite-admin`。
- `vars.API_ORIGIN`：真实后端的协议、域名和端口，不带 `/api`。
  当前与 Vercel 一样使用文档占位地址 `http://203.0.113.10:3000`，不能作为可用后端。

本地预构建从 `.env`、`.env.production`、`.env.local` 等 Vite 配置和当前 shell 读取变量。
保留 `VITE_APP_NAME=g`。Supabase 的 `VITE_SUPABASE_URL` 和
`VITE_SUPABASE_PUBLISHABLE_KEY` 等前端配置按需要写在 `.env.local`。
Vercel 的 `pull` 不会在 Cloudflare 流程中执行；Cloudflare 控制台的运行时变量也不会自动进入本机 Vite 构建。
不要将私有密钥放入 `VITE_` 变量。

```bash
# 构建并发布至 Cloudflare
pnpm deploy:admin:cloudflare

# 部署到 Vercel
pnpm deploy:admin:vercel
```

## 本地验证与 CI

```bash
# 只构建、校验和打包，不发布
pnpm deploy:admin:cloudflare --dry-run

# 已构建后，从仓库根目录启动 Workers 本地运行环境
cd apps/frontend/react-vite-admin
pnpm dlx wrangler@latest dev --config wrangler.jsonc
```

CI 运行相同部署命令，将 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`
配置为 CI 的环境变量，不写入仓库。前端构建变量也在 CI 构建环境中提供。
`dist/`、`.wrangler/`、`.dev.vars*` 不提交。

## 路由行为

- `/`、`/g` 重定向到 `/g/`。
- `/g/js/*`、`/g/css/*` 等资源由 ASSETS 提供。
- `/g/` 及浏览器直接访问的深层页面回退到 `/g/index.html`。
- `/g/api/*` 转发为 `${API_ORIGIN}/api/*`，保留方法、查询参数、请求体及认证头。
  后端仍需自行验证用户权限；上游重定向原样返回。
- 找不到的资源以及 `/g/` 之外的路径返回 404。

发布后检查首页、深层路由刷新、静态资源和 API。此方案仅部署 admin，后端需要单独运行。

参考：[Workers 静态资源](https://developers.cloudflare.com/workers/static-assets/binding/)、
[Worker 路由](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/)。
