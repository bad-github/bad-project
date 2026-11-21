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
  // 运行时 JS：ESM/CJS 使用明确后缀；UMD 使用 .js 供浏览器脚本加载。
  {
    input: 'src/index.ts',
    external,
    output: [
      {file: pkg.main, format: 'cjs', sourcemap},
      {file: pkg.module, format: 'es', sourcemap},
      {
        // UMD 使用 .js；Node 消费本库时使用专门的 .cjs/.mjs 入口。
        file: pkg.unpkg,
        format: 'umd',
        name: 'BadProjectSupabase',
        sourcemap,
        // 浏览器 UMD 模式需预先提供这些全局依赖；此映射不会加载依赖。
        // SDK 的 UMD 产物声明 var supabase，大小写需与该全局名称一致。
        globals: {'@supabase/supabase-js': 'supabase'},
      },
    ],
    // 编译 TS 为 JS，并同步控制编译阶段的 Source Map。
    plugins: [typescript({tsconfig: './tsconfig.build.json', sourceMap: sourcemap})],
  },
  // 类型声明：独立从源码生成 .d.ts，不包含运行时实现。
  {
    input: 'src/index.ts',
    external,
    output: {file: pkg.types, format: 'es'},
    plugins: [dts({tsconfig: './tsconfig.build.json'})],
  },
]);
