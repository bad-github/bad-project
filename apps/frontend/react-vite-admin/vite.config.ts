import {defineConfig, loadEnv, normalizePath, type PluginOption} from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path'; //  需要执行：npm install -D @types/node
import {fileURLToPath} from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';
import {visualizer} from 'rollup-plugin-visualizer';
// 配置及其依赖未来会由 Vite native 加载器直接交给 Node 执行。
// Node ESM 不会为相对导入补全扩展名，因此显式使用实际的 .ts 后缀。
import createVersionHtml from './vite-plugin/version.ts';
import injectBuildAttr from './vite-plugin/inject-build-attr.ts';

const packageJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8'));
export const workspaceDeps = Object.entries({...packageJson.dependencies, ...packageJson.devDependencies})
  .filter(([, version]) => typeof version === 'string' && version.startsWith('workspace:'))
  .map(([name]) => name.replace('@workspace/', ''));

// https://vite.dev/config/
export default defineConfig(({mode}) => {
  // 设置第三个参数为 '' 来加载所有环境变量，而不管是否有`VITE_` 前缀，所以 env.BUILD_ENV 能拿到
  // .env 文件的变量不等价自动进入 process.env
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = mode === 'development';
  // development dev undefined，defined定义process.env.BUILD_ENV后可使用
  console.log(env.VITE_BUILD_ENV, env.BUILD_ENV, process.env.BUILD_ENV, '===');
  return {
    /**
     * 所有相对路径（包括脚本、资源、fetch 请求等）都将被认为是相对于 env.VITE_APP_NAME 路径来加载的
     * (1)静态资源路径会变成：<script src="/g/assets/index.abc.js">
     * (2)HTML 入口路径是 /g/index.html
     * (3)浏览器当前 URL 是 http://localhost:5173/g/xxxx
     */
    base: `/${env.VITE_APP_NAME}/`,
    plugins: [
      react(),
      tailwindcss(),
      svgr({
        /**
         * 导入svg?react格式时，作为react组件使用
         * 导入.svg格式时，作为url使用，比如可以放在img的src中
         */
        include: '**/*.svg?react', // 默认也是如此配置
      }),
      createVersionHtml(),
      injectBuildAttr(),
      visualizer({
        open: false,
        filename: 'stats.html',
      }) as PluginOption,
    ],
    resolve: {
      /**
       * true：node_modules/@workspace/mock/src/index.ts
       * false：
       *    packages/mock/src/index.ts，跟随软链接
       *    所有引用这个文件的地方都被认为是“同一个模块”
       */
      // todo
      // preserveSymlinks: false,
      alias: {
        '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src'),
        // 或如下配置
        // '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@workspace/i18n': fileURLToPath(new URL('../../../packages/i18n/src', import.meta.url)),
        '@workspace/mock': fileURLToPath(new URL('../../../packages/mock/src', import.meta.url)),
        '@workspace/utils': fileURLToPath(new URL('../../../packages/utils/src', import.meta.url)),
        '@workspace/supabase': fileURLToPath(new URL('../../../packages/supabase/src', import.meta.url)),
        // 注意src目录下需要有index.ts/tsx
        '@workspace/editor': fileURLToPath(new URL('../../../packages/editor/src', import.meta.url)),
      },
    },
    define: {
      // JSON.stringify(new Date().toISOString()）
      'process.env.APP_BUILD_TIME': JSON.stringify(''),
      'process.env.BUILD_ENV': JSON.stringify(env.BUILD_ENV),
      /**
       * process 是 node 内置的全局变量
       * 在 Vite 编译代码时，如果发现业务代码里出现了 process.env 这个词，就把它全量替换成后面这个巨大的对象
       * 缺陷：会将你电脑里所有的环境变量（可能包含数据库密码、密钥等）都暴露在前端产物的 JS 代码中
       */
      // 'process.env': {...process.env, ...env},
    },
    // 改了下面配置后需要使用--force启动
    optimizeDeps: {
      // todo，对于变动不频繁的包建议预构建
      exclude: ['@workspace/i18n', '@workspace/mock', '@workspace/utils', '@workspace/supabase', '@workspace/editor'],
      /**
       * 预构建：
       * lucide-react：没有自动预构建，每个图标构建为单独的文件，一个文件就是一个http请求。配置参与预构建后，将其构建成单个模块，只需一个http请求
       * lodash-es：自动预构建了，可不必配置。在node_modules/.vite/lodash-es.js查看到预构建的结果
       */
      //
      include: ['lucide-react'],
    },
    // worker 会默认打包到assets目录下
    worker: {},
    build: {
      outDir: `dist/${env.VITE_APP_NAME}/`,
      // 通过vite preview预览打包后的生产环境产物，来检验是否有源码映射
      sourcemap: isDev,
      // cssCodeSplit: true,
      rolldownOptions: {
        output: [
          // {
          //   format: 'umd',
          //   name: 'ReactViteShadcn', // 必须指定名字，配合lib打包模式，window.ReactViteShadcn即可使用
          //   entryFileNames: 'umd/js/react-vite-shadcn.js', // umd 格式下最好不要加hash
          //   assetFileNames: 'umd/assets/[name].[hash][extname]',
          //   inlineDynamicImports: true,
          //   // 只有在打包格式为 UMD 或 IIFE（通过 <script> 标签直接引入）时才起作用，一般需要和external配合使用
          //   // globals: {
          //   //   // key是代码里的模块名：import React from 'react'
          //   //   // value是运行环境中（浏览器）预先存在的全局变量名，window.React,window.ReactDOM
          //   //   react: 'React',
          //   //   'react-dom': 'ReactDOM',
          //   // },
          //   // external: ['react', 'react-dom'], // 直接跳过这两个依赖的打包，可以使用cdn集成或在使用此打包文件的上层项目中引入依赖，最好在package中加上peerDependencies
          // },
          // vite会以最后一个配置作为html注入的入口
          {
            format: 'es',
            // 入口chunk文件名：入口js
            entryFileNames: 'js/[name].[hash].entry.js',
            // 资源文件打包规则
            assetFileNames: (assetInfo) => {
              const name = assetInfo.names[0] || '';
              // css文件
              if (name.endsWith('.css')) {
                const originalPath = assetInfo.originalFileNames[0]
                  ? normalizePath(assetInfo.originalFileNames[0])
                  : '';
                // 三方库单独打包到指定目录，前提条件manualChunks必须拆对应的包
                /* const cssLibs = ['xyflow', 'dockview', 'react-querybuilder'];
                if (cssLibs.some((lib) => name.includes(lib))) {
                  return 'css/lib/[name].[hash].[ext]';
                } */
                // 主题文件添加theme目录
                if (originalPath.includes('styles/theme')) {
                  return 'css/theme/[name].[hash].[ext]';
                }
                // 如果manualChunks还有未分包的三方依赖还有css，则会打包到定义的vendors.hash.css
                return 'css/[name].[hash].[ext]';
              }
              // 图片资源
              const imgExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.icon', '.svg'];
              if (imgExts.some((ext) => name.endsWith(ext))) {
                return 'img/[name].[hash].[ext]';
              }
              // 字体资源
              const fontExts = ['.woff', '.woff2', '.ttf', '.eot', '.otf'];
              if (fontExts.some((ext) => name.endsWith(ext))) {
                return 'font/[name].[ext]';
              }
              // 其他资源放到 assets/
              return 'assets/[name].[hash].[ext]';
            },
            // 代码分割chunk文件名，决定Chunk最终叫什么名字
            chunkFileNames(chunkInfo) {
              // 保留手动分组的目录；下面只调整自动 chunk 的输出位置，不合并模块。
              if (chunkInfo.name.startsWith('chunk/')) {
                return 'js/[name].[hash].js';
              }

              // 编辑器业务 chunk 优先归类，避免因包含少量 Radix 组件而移动整个文件。
              if (chunkInfo.moduleIds.some((id) => normalizePath(id).includes('/packages/editor/'))) {
                return 'js/workspace/editor/[name].[hash].js';
              }

              const libDirectories = [
                {name: 'base-ui', packages: ['@base-ui/']},
                {name: 'radix-ui', packages: ['@radix-ui/', 'radix-ui/']},
                {name: 'lodash', packages: ['lodash/', 'lodash-es/']},
              ];
              const moduleIds = chunkInfo.moduleIds.map((id) => normalizePath(id));
              const matchedLibraries = libDirectories.filter(({packages}) =>
                moduleIds.some((id) => packages.some((pkg) => id.includes(`/node_modules/${pkg}`)))
              );

              // 自动 chunk 可能包含业务代码或其他依赖，整个文件一起移动。
              if (matchedLibraries.length === 1) {
                return `js/chunk/${matchedLibraries[0].name}/[name].[hash].js`;
              }
              // 多个目标库共用一个自动 chunk 时，保留共享关系。
              if (matchedLibraries.length > 1) {
                return 'js/chunk/shared/[name].[hash].js';
              }

              const workspaceNames = new Set(
                chunkInfo.moduleIds.flatMap((id) => {
                  const path = normalizePath(id);
                  if (path.includes('/node_modules/')) return [];

                  const match = path.match(/\/packages\/([^/]+)\//);
                  return match ? [match[1]] : [];
                })
              );

              // 只涉及一个 workspace 包，放到对应目录。
              if (workspaceNames.size === 1) {
                const [name] = workspaceNames;
                return `js/workspace/${name}/[name].[hash].js`;
              }

              // 多个 workspace 包共享的 chunk。
              if (workspaceNames.size > 1) {
                return 'js/workspace/shared/[name].[hash].js';
              }

              return 'js/[name].[hash].js';
            },
            // 保持模块副作用的执行顺序，配合下方不递归收集依赖的编辑器分组。
            strictExecutionOrder: true,
            codeSplitting: {
              // 分组决定模块归属；文件最终输出目录仍由 chunkFileNames 决定。
              // 分包本身不等于懒加载，是否按需下载仍取决于源码中的静态/动态导入关系。
              groups: [
                {
                  // 所有 @tiptap/* 包合为一组，输出 js/chunk/tiptap.[hash].js。
                  name: 'chunk/tiptap',
                  // 精确匹配 node_modules 下的包路径，兼容 POSIX 和 Windows 分隔符。
                  test: /[\\/]node_modules[\\/]@tiptap[\\/]/,
                  // 优先于下方默认优先级的通用库分组，避免被其递归依赖收集抢走。
                  priority: 20,
                  // 只收集匹配模块，避免将首页共用的 UI 依赖一起装入编辑器包，
                  // 导致首页通过这些依赖提前下载整个 Tiptap 包。
                  includeDependenciesRecursively: false,
                },
                {
                  // ProseMirror 是编辑器底层，所有 prosemirror-* 包共用一个 chunk。
                  name: 'chunk/prosemirror',
                  test: /[\\/]node_modules[\\/]prosemirror-[^\\/]+[\\/]/,
                  // 与 Tiptap 组同级，优先锁定这些模块的归属。
                  priority: 20,
                  // 共享工具依赖交由构建器处理，不递归吸入当前组。
                  includeDependenciesRecursively: false,
                },
                {
                  // 沿用原 manualChunks 的 React、Apollo 等分组规则。
                  // 未设置 includeDependenciesRecursively，沿用默认 true：递归收集依赖；
                  // 上面高优先级编辑器组已经匹配的模块仍保留在各自组中。
                  // debugName 仅用于构建耗时报告，实际 chunk 名由 name(id) 返回。
                  debugName: 'existing-library-groups',
                  name(id) {
                    if (id.includes('node_modules')) {
                      // scheduler 是 react-dom 的核心依赖
                      // 前后都有/是为了区分react-router，react-i18next这种依赖
                      // [\\/] 是为了兼容 Windows (\) 和 Linux (/) 的路径分隔符，(react|react-dom|scheduler)：精准捕获
                      if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
                        return 'chunk/react-vendor';
                      }
                      const bigLibs = [
                        '@apollo/client/',
                        'react-router/',
                        'echarts/',
                        '@xyflow/react/',
                        'dockview/',
                        'elkjs/',
                        'react-querybuilder/',
                      ];
                      const target = bigLibs.find((lib) => id.includes(`node_modules/${lib}`));
                      if (target) {
                        return (
                          'chunk/' +
                          target
                            .replace(/\/$/, '') // (1)：去掉末尾的斜杠 (react-router/ -> react-router)
                            .replace(/^@/, '') // (2)：去掉开头的 @ (@radix-ui -> radix-ui)
                            .replace(/\//g, '_')
                        ); // (3)：将剩下的 / 替换为 _ (@xyflow/react -> xyflow_react)
                      }
                      // 不合理：所有未命中的第三方依赖都挤进 vendor
                      // return `chunk/vendor`;
                      // 未明确分组的模块交给构建器自动处理
                      return undefined;
                    }
                  },
                },
              ],
            },
          },
        ],
      },
    },
    server: {
      port: 5175,
      // 支持ip访问
      host: true,
      proxy: {
        /**
         * 代理本地，保留api前缀，这代表后端所有接口服务都有此前缀
         */
        [`/${env.VITE_APP_NAME}/api`]: {
          target: 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp(`^/${env.VITE_APP_NAME}/api`), '/api'),
        },
        /**
         * 转发到nginx，然后nginx再转发到后端，注意这里是完整的url
         * 浏览器网络面板查看server是否是nginx
         * 这是为了校验本地和线上请求一致时添加的测试地址，也可以使用上面的直接转到http服务
         * 服务端的nginx网关代理为：
         * 
         * # 去掉 /g 前缀，保留/api，本机有3000端口的api服务，/g/api是前端定义的，后端无需关注，但nginx配置需要关注。proxy_pass是最终后端的服务地址，前端无需关注，但是nginx配置需要关注
            location /g/api/ {
              proxy_pass http://localhost:3000/api/;

              proxy_set_header Host $host;
              proxy_set_header X-Real-IP $remote_addr;
              proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
              proxy_set_header X-Forwarded-Proto $scheme;
            }
         */
        // [`/${env.VITE_APP_NAME}/api`]: {
        //   target: 'http://ip:81',
        //   changeOrigin: true,
        // },
        // 代理ws
        '/ws': {
          target: 'ws://localhost:81', // WebSocket 的目标服务地址
          changeOrigin: true,
          ws: true, // 启用 websocket 代理
          rewrite: (path) => path.replace(/^\/ws/, ''), // /ws/common => /common
        },
        // 代理graphql
        '/graphql': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          // 代理 websocket，如果有需要
          ws: true,
        },
      },
    },
  };
});
