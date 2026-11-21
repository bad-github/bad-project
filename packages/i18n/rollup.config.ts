// 详细配置说明与备选方案见同目录 README.md。
import {defineConfig} from 'rollup';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import fs from 'node:fs';
import {loadEnvFile} from 'node:process';

// 只加载本包 .env；已有的进程环境变量优先，具体规则见 README.md。
loadEnvFile(new URL('./.env', import.meta.url));
const buildEnv = process.env.BUILD_ENV ?? 'development';
if (buildEnv !== 'development' && buildEnv !== 'production') {
  throw new Error(`不支持的 BUILD_ENV：${buildEnv}，请使用 development 或 production`);
}
const sourcemap = buildEnv === 'development';

const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
// 外置运行依赖及宿主依赖，保留包引用。
const dependencies = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})];
const external = (id: string) => dependencies.some((name) => id === name || id.startsWith(`${name}/`));

export default defineConfig([
  // ESM/CJS 多入口：核心、加载器映射和主动选择的全量资源相互独立。
  {
    input: {index: 'src/index.ts', locales: 'src/locales/index.ts', resources: 'src/resources.ts'},
    external,
    output: [
      {
        dir: 'dist/cjs',
        entryFileNames: '[name].cjs',
        chunkFileNames: 'locales/[name]-[hash].cjs',
        format: 'cjs',
        sourcemap,
      },
      {
        dir: 'dist/esm',
        entryFileNames: '[name].mjs',
        chunkFileNames: 'locales/[name]-[hash].mjs',
        format: 'es',
        sourcemap,
      },
    ],
    plugins: [typescript({tsconfig: './tsconfig.build.json', sourceMap: sourcemap})],
  },
  // UMD 仅提供核心 API，调用方通过 loaders 注入 fetch 等浏览器加载器。
  {
    input: 'src/index.ts',
    external,
    output: {
      file: pkg.unpkg,
      format: 'umd',
      name: 'BadProjectI18n',
      sourcemap,
      globals: {i18next: 'i18next', 'react-i18next': 'ReactI18next'},
    },
    plugins: [typescript({tsconfig: './tsconfig.build.json', sourceMap: sourcemap})],
  },
  // 每个公开入口分别输出可独立消费的声明，类型导入不加载语言资源。
  ...['index', 'locales', 'resources'].map((name) => ({
    input: name === 'locales' ? 'src/locales/index.ts' : `src/${name}.ts`,
    external,
    output: {file: `dist/types/${name}.d.ts`, format: 'es' as const},
    plugins: [dts({tsconfig: './tsconfig.build.json'})],
  })),
]);
