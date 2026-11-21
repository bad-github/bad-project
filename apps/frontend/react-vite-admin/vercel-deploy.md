# react-vite-admin 部署到 Vercel

采用本地预构建流程，部署 `dist`，访问地址为 `https://你的域名/g/`。

## 配置与执行目录

部署命令统一在 `apps/frontend/react-vite-admin` 执行，使用 `./vercel.json`：

| 配置项 | 值 |
| --- | --- |
| 构建命令 | `pnpm run build` |
| 输出目录 | `dist` |
| 框架预设 | Other（`framework: null`） |
| 路径前缀 | `/g/`，保留 `VITE_APP_NAME=g` |

Vite 将页面和资源生成到 `dist/g/`。Vercel 输出目录必须是 `dist`，这样 `/g/index.html`、`/g/js/`、`/g/css/` 等地址能对应到实际文件。

配置将 `/`、`/g` 重定向到 `/g/`，显式将 `/g/` 及前端深层路由映射到 `/g/index.html`；静态文件由文件系统提供。`/g/api/*` 按配置转发到后端，API 规则位于页面回退规则之前。部署前确认配置中的后端地址可用。

`--local-config "$config_path"` 显式指定本地配置文件，使用绝对路径避免构建过程中相对路径解析异常。只有工作目录为 `apps/frontend/react-vite-admin`，且配置使用默认名称 `vercel.json` 并位于该目录时，才可以省略此参数；本文统一保留参数。[参数说明](https://vercel.com/docs/cli/global-options#local-config)

## 首次部署

使用满足仓库根 `package.json` 要求的 Node.js 和 pnpm。先在仓库根目录安装依赖，使用根目录的 `pnpm-lock.yaml`，无需复制锁文件。

```bash
# 从仓库根目录开始。
pnpm install --frozen-lockfile
cd apps/frontend/react-vite-admin
config_path="$PWD/vercel.json"

# 登录账号；已登录可跳过，此命令不需要项目配置。
pnpm dlx vercel@latest login

# 关联 admin 项目，代码目录选择当前目录 ./。
pnpm dlx vercel@latest link --local-config "$config_path"

# 拉取生产配置和环境变量。
pnpm dlx vercel@latest pull --yes --environment=production --local-config "$config_path"

# 按 vercel.json 在本地构建，生成 .vercel/output/。
pnpm dlx vercel@latest build --prod --local-config "$config_path"

# 上传预构建产物并发布。
pnpm dlx vercel@latest deploy --prebuilt --prod --local-config "$config_path"
```

项目关联保存在当前目录的 `.vercel/project.json`。`dist/` 是应用产物；实际上传的是 `vercel build` 生成的 `.vercel/output/`。所有部署命令在应用目录执行，不进入产物目录。

## 后续发布

已登录并关联后，可以直接在仓库根目录执行：

```bash
pnpm deploy:admin
```

该命令调用 `scripts/deploy-admin.sh`，自动进入 admin 目录，依次执行下面的拉取、构建和发布命令；任一步失败都会停止。

已登录并关联后，在 `apps/frontend/react-vite-admin` 执行：

```bash
config_path="$PWD/vercel.json"
pnpm dlx vercel@latest pull --yes --environment=production --local-config "$config_path"
pnpm dlx vercel@latest build --prod --local-config "$config_path"
pnpm dlx vercel@latest deploy --prebuilt --prod --local-config "$config_path"
```

修改代码、构建配置、路由规则或环境变量后，重新 build 再 deploy；直接上传旧的预构建产物不会包含修改。

发布后访问域名根路径，确认跳转到 `/g/`；直接访问并刷新深层路由，检查 JS、CSS、字体、图片和 API 请求。`.vercel/` 与 `dist/` 已忽略，不提交到 Git。

官方流程：[本地构建](https://vercel.com/docs/cli/build)、[预构建部署](https://vercel.com/docs/cli/deploy#prebuilt)。
