# Demo：产物模式

当前只支持 `dist` 模式，用于演示 workspace 包通过 `package.json` 的 `exports` 被消费的方式。demo 不设置源码别名，也不添加 TS 源码路径映射；包导出到哪里，就从哪里加载。

在仓库根目录执行：

- `pnpm dev:demo` 或 `pnpm dev:demo:dist`：先构建依赖包，再启动 demo。
- `pnpm build:demo:dist`：先构建依赖包，再构建 demo。

在 demo 目录执行 `pnpm dev` / `pnpm dev:dist`、`pnpm build` / `pnpm build:dist` 时，都使用 `--mode dist`；此时须自行保证依赖包已经构建。

切换校验最新改动时，重新运行根目录命令，Turbo 会按依赖变化更新构建产物。

未来可以在 Vite 配置中按 mode 扩展源码模式，目前没有提供源码模式命令。本模式通过 workspace 链接消费包，尚不等同于安装 npm 发布压缩包的校验。
