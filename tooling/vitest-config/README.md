# @workspace/vitest-config

工作区共享的 Vitest 配置，无需构建。默认在 Node 环境中运行 `src/` 和 `tests/` 下的 `*.test.{ts,tsx,js,jsx,mjs}` 文件。

使用方在 `devDependencies` 中声明 `@workspace/vitest-config: workspace:*` 和 `vitest`，版本由根目录 `pnpm-workspace.yaml` 的 `overrides` 统一控制。

```ts
// vitest.config.ts
import baseConfig from '@workspace/vitest-config/base.js';
import {defineConfig, mergeConfig} from 'vitest/config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: 'my-package',
    },
  }),
);
```

没有额外配置时，可直接 `export {default} from '@workspace/vitest-config/base.js'`。

各模块自行提供 `test: vitest run`、`test:watch: vitest` 脚本。共享配置不会加载模块的 Vite 应用配置；需要的插件和路径别名由模块自行配置。
