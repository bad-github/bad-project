import {defineConfig, mergeConfig, type UserConfig} from 'vite';
import commonjs from '@rollup/plugin-commonjs';
import baseConfig from './vite.base.config.ts';
import pkg from './package.json' with {type: 'json'};

const umdConfig: UserConfig = {
  // 浏览器没有 Node 环境变量；固定生产环境，同时移除开发分支。
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env.FORCE_COLOR': 'false',
  },
  build: {
    // UMD 在 ESM 之后构建，保留已有 ESM、CSS 和声明。
    emptyOutDir: false,
    lib: {
      entry: pkg.source,
      formats: ['umd'],
    },
    rolldownOptions: {
      // 页面提供同版本 React、ReactDOM、JSX runtime；其他依赖打入单文件。
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      plugins: [
        commonjs({
          // 转换此依赖的 React require，避免 Vite 8 产物依赖浏览器中不存在的 require。
          include: /use-sync-external-store\/cjs\/.*\.production\.js$/,
          strictRequires: false,
          ignore: (id) => id !== 'react',
        }),
      ],
      output: {
        // .cjs 让 Node 按 CommonJS 加载，同时仍可通过浏览器普通 script 使用。
        entryFileNames: pkg.main.replace(`${pkg.output}/`, ''),
        format: 'umd',
        exports: 'named',
        name: 'TiptapEditor',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'ReactJSXRuntime',
        },
      },
    },
  },
};

export default defineConfig(mergeConfig(baseConfig, umdConfig));
