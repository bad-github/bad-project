import {defineConfig, mergeConfig, type UserConfig} from 'vite';
import dts from 'vite-plugin-dts';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import baseConfig from './vite.base.config.ts';
import pkg from './package.json' with {type: 'json'};

const externalPackages = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)];

const esmConfig: UserConfig = {
  // 两种格式共用声明，仅在 ESM 阶段生成。
  plugins: [
    dts({
      outDir: resolve(pkg.output, 'types'),
      tsconfigPath: './tsconfig.app.json',
      entryRoot: 'src',
      // 只为公共入口及其公开类型依赖生成声明，避免收集无关扩展的模块增强。
      include: ['src/index.tsx', 'src/App.tsx', 'src/provider/editor-provider.tsx', 'src/demo/content.ts'],
      // 按公共入口的类型引用关系合并，仅发布一个 index.d.ts。
      // 内部组件、演示页等实现模块的声明不会单独发布。
      rollupTypes: true,
      // 保证根声明输出为 dist-lib/types/index.d.ts，不带额外的 src 层级。
      compilerOptions: {
        rootDir: fileURLToPath(new URL('./src', import.meta.url)),
      },
    }),
  ],
  build: {
    // 完整构建先执行 ESM，清理公共产物目录。
    emptyOutDir: true,
    lib: {
      entry: pkg.source,
      formats: ['es'],
    },
    rolldownOptions: {
      external: (id) => {
        // 第三方样式交给 Vite 编译；JS 依赖及包子路径保留为 import。
        if (/\.(css|scss|sass|less|styl|stylus)(?:\?|$)/.test(id)) return false;
        return externalPackages.some((name) => id === name || id.startsWith(`${name}/`));
      },
      // Rolldown 保留源码入口的 use client，无需再次注入。
      output: {
        // 使用 .mjs 明确标识 ESM，无需生成目录级 package.json。
        entryFileNames: pkg.module.replace(`${pkg.output}/`, ''),
        format: 'es',
      },
    },
  },
};

export default defineConfig(mergeConfig(baseConfig, esmConfig));
