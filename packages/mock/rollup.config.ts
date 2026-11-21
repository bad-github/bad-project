import {defineConfig} from 'rollup';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import fs from 'node:fs';
import {loadEnvFile} from 'node:process';

// 仅加载本包 .env；已有进程变量优先，开发模式开启 Source Map。
loadEnvFile(new URL('./.env', import.meta.url));
const buildEnv = process.env.BUILD_ENV ?? 'development';
if (buildEnv !== 'development' && buildEnv !== 'production') {
  throw new Error(`不支持的 BUILD_ENV：${buildEnv}，请使用 development 或 production`);
}
const sourcemap = buildEnv === 'development';

const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
// 外置 dependencies/peerDependencies，保留引用；外置不要求必须声明为 peer。
const dependencies = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})];
// 同时匹配包名与子路径，依赖实现不内嵌进产物。
const external = (id: string) => dependencies.some((name) => id === name || id.startsWith(`${name}/`));

export default defineConfig([
  // 核心和语言加载器分入口，UMD 核心不包含裸包名动态导入。
  {
    input: {index: 'src/index.ts', locales: 'src/locales.ts'},
    external,
    output: [
      {dir: 'dist/cjs', entryFileNames: '[name].cjs', format: 'cjs', sourcemap},
      {dir: 'dist/esm', entryFileNames: '[name].mjs', format: 'es', sourcemap},
    ],
    plugins: [typescript({tsconfig: './tsconfig.build.json', sourceMap: sourcemap})],
  },
  {
    input: 'src/index.ts',
    external,
    output: {
      // UMD 使用 .js；Node 消费本库时使用专门的 .cjs/.mjs 入口。
      file: pkg.unpkg,
      format: 'umd',
      name: 'BadProjectMock',
      sourcemap,
    },
    // 编译 TS 为 JS，并同步控制编译阶段的 Source Map。
    plugins: [typescript({tsconfig: './tsconfig.build.json', sourceMap: sourcemap})],
  },
  // 类型声明：独立从源码生成 .d.ts，不包含运行时实现。
  ...['index', 'locales'].map((name) => ({
    input: `src/${name}.ts`,
    external,
    output: {file: `dist/types/${name}.d.ts`, format: 'es' as const},
    plugins: [dts({tsconfig: './tsconfig.build.json'})],
  })),
]);
