#!/usr/bin/env bash
set -euo pipefail

# 根据脚本位置定位项目，不依赖调用时的工作目录。
cd "$(dirname "${BASH_SOURCE[0]}")/../apps/frontend/next-app"

pnpm dlx vercel@latest pull --yes --environment=production --local-config ./vercel.json
pnpm dlx vercel@latest build --prod --standalone --local-config ./vercel.json
pnpm dlx vercel@latest deploy --prebuilt --prod --archive=tgz --local-config ./vercel.json
