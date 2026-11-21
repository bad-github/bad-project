# editor app 部署到 Vercel

采用本地预构建流程，只构建 app 并部署 `dist-app`，访问地址为 `https://你的域名/editor/`。

## 配置与执行目录

部署命令统一在 `packages/editor` 执行，使用 `./vercel.json`：

| 配置项 | 值 |
| --- | --- |
| 构建命令 | `pnpm run build:app` |
| 输出目录 | `dist-app` |
| 路径前缀 | `/editor/`，保留 `VITE_APP_NAME=editor` |

配置中的重定向将 `/`、`/editor` 引导到 `/editor/`；显式将带结尾斜杠的 `/editor/` 重写到 `index.html`，并将 `/editor/assets/` 映射到产物的 `assets/`。

`--local-config "$config_path"` 显式指定本地配置文件，使用绝对路径避免构建过程中相对路径解析异常。只有工作目录为 `packages/editor`，且配置使用默认名称 `vercel.json` 并位于该目录时，本文命令才可以省略此参数；改名、移动配置或改变工作目录后，应显式指定正确路径。本文统一保留参数。[参数说明](https://vercel.com/docs/cli/global-options#local-config)

## 首次部署

使用满足仓库根 `package.json` 要求的 Node.js 和 pnpm。先在仓库根目录安装依赖，使用根目录的 `pnpm-lock.yaml`，无需复制锁文件。

```bash
# 从仓库根目录开始。
pnpm install --frozen-lockfile
cd packages/editor
config_path="$PWD/vercel.json"

# 登录账号；已登录可跳过，此命令不需要项目配置。
pnpm dlx vercel@latest login

# 关联独立的 editor 项目，代码目录选择当前目录 ./。
pnpm dlx vercel@latest link --local-config "$config_path"

# 拉取生产配置和环境变量。
pnpm dlx vercel@latest pull --yes --environment=production --local-config "$config_path"

# 按 vercel.json 在本地构建，生成 .vercel/output/。
pnpm dlx vercel@latest build --prod --local-config "$config_path"

# 上传预构建产物并发布。
pnpm dlx vercel@latest deploy --prebuilt --prod --local-config "$config_path"
```

项目关联保存在当前目录的 `.vercel/project.json`。`dist-app/` 是 app 产物；实际上传的是 `vercel build` 生成的 `.vercel/output/`。

## 后续发布

已登录并关联后，可以直接在仓库根目录执行：

```bash
pnpm deploy:editor:vercel
```

该命令调用 `scripts/deploy-editor-vercel.sh`，自动进入 editor 目录，依次执行下面的拉取、构建和发布命令；任一步失败都会停止。构建使用 `vercel.json` 中的 `build:app`，仅部署 app。

在 `packages/editor` 执行：

```bash
config_path="$PWD/vercel.json"
pnpm dlx vercel@latest pull --yes --environment=production --local-config "$config_path"
pnpm dlx vercel@latest build --prod --local-config "$config_path"
pnpm dlx vercel@latest deploy --prebuilt --prod --local-config "$config_path"
```

发布后访问域名根路径，确认跳转到 `/editor/`，刷新页面并检查 JS、CSS、图片加载和编辑器操作。`.vercel/` 与 `dist-app/` 已忽略，不提交到 Git。

以上命令需要你登录并关联实际项目后执行。官方流程：[本地构建](https://vercel.com/docs/cli/build)、[预构建部署](https://vercel.com/docs/cli/deploy#prebuilt)。
