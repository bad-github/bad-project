#!/usr/bin/env bash
set -euo pipefail

# 与 Vercel 使用同一份 Vite 构建产物。
cd "$(dirname "${BASH_SOURCE[0]}")/../apps/frontend/react-vite-admin"
pnpm run build
test -f dist/g/index.html || { echo 'Cloudflare 路由要求 VITE_APP_NAME=g，且构建生成 dist/g/index.html。' >&2; exit 1; }
pnpm dlx wrangler@latest deploy --config "$PWD/wrangler.jsonc" "$@"
