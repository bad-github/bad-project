# next-app 部署到 Vercel

采用本地预构建流程，访问地址为 `https://你的域名/`，页面及服务端能力由 Vercel 的 Next.js 预设处理。

## 配置与执行目录

部署命令统一在 `apps/frontend/next-app` 执行，使用 `./vercel.json`：

| 配置项 | 值 |
| --- | --- |
| 框架预设 | Next.js（`framework: "nextjs"`） |
| 安装命令 | `pnpm install --frozen-lockfile` |
| 构建命令 | `pnpm run build`（执行 `next build`） |
| 输出目录 | `.next` |

`next.config.ts` 保留 `output: 'standalone'`。Vercel 仍使用 `.next` 构建结果进行平台适配，输出目录不填写 `.next/standalone`，也不额外添加 SPA 回退规则。

`--local-config ./vercel.json` 显式指定本地配置文件，不改变项目目录。只有工作目录为 `apps/frontend/next-app`，且配置使用默认名称 `vercel.json` 并位于该目录时，本文命令才可以省略此参数；改名、移动配置或改变工作目录后，应显式指定正确路径。本文统一保留参数。[参数说明](https://vercel.com/docs/cli/global-options#local-config)

`vercel build --standalone` 将函数依赖放入各自的输出目录，使预构建产物包含所需依赖；它与 `next.config.ts` 的 `output: 'standalone'` 属于不同层面的配置。`deploy --archive=tgz` 将文件打包后上传，减少大量文件逐个上传的开销。[上传参数说明](https://vercel.com/docs/cli/deploy#archive)

## 首次部署

使用满足仓库根 `package.json` 要求的 Node.js 和 pnpm。先在仓库根目录安装工作区依赖，使用根目录的 `pnpm-lock.yaml`，无需复制锁文件。

```bash
# 从仓库根目录开始。
pnpm install --frozen-lockfile
cd apps/frontend/next-app

# 登录账号；已登录可跳过，此命令不需要项目配置。
pnpm dlx vercel@latest login

# 关联 next-app 项目，代码目录选择当前目录 ./。
pnpm dlx vercel@latest link --local-config ./vercel.json

# 拉取生产配置和环境变量。
pnpm dlx vercel@latest pull --yes --environment=production --local-config ./vercel.json

# 按 vercel.json 在本地构建，生成 .vercel/output/。
pnpm dlx vercel@latest build --prod --standalone --local-config ./vercel.json

# 上传预构建产物并发布。
pnpm dlx vercel@latest deploy --prebuilt --prod --archive=tgz --local-config ./vercel.json
```

项目关联保存在当前目录的 `.vercel/project.json`。已关联该项目时，可跳过 login 和 link，直接执行后续发布步骤。

`.next/` 是 Next.js 构建目录；实际上传的是 `vercel build` 生成的 `.vercel/output/`，其中包含适配后的静态资源和服务端产物。所有部署命令在应用目录执行，不进入产物目录。

## 后续发布

已登录并关联后，可以直接在仓库根目录执行：

```bash
pnpm deploy:next:vercel
```

该命令调用 `scripts/deploy-next-vercel.sh`，自动进入 next-app 目录，依次执行下面的拉取、构建和发布命令；任一步失败都会停止。

在 `apps/frontend/next-app` 执行：

```bash
pnpm dlx vercel@latest pull --yes --environment=production --local-config ./vercel.json
pnpm dlx vercel@latest build --prod --standalone --local-config ./vercel.json
pnpm dlx vercel@latest deploy --prebuilt --prod --archive=tgz --local-config ./vercel.json
```

修改代码、配置或环境变量后，重新 build 再 deploy；直接上传旧的预构建产物不会包含修改。

发布后访问域名根路径，检查语言跳转、页面导航、深层页面刷新、图片和静态资源加载，以及实际使用的服务端接口。`.vercel/` 和 `.next/` 已忽略，不提交到 Git。

官方流程：[Next.js 构建设置](https://vercel.com/docs/builds/configure-a-build)、[本地构建](https://vercel.com/docs/cli/build)、[预构建部署](https://vercel.com/docs/cli/deploy#prebuilt)。
