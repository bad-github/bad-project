import {defineConfig} from 'vite';

// 当前为 dist（产物）模式：不配置源码别名，按各包的 exports 加载。
// 将来增加源码模式时，在这里按 mode 扩展解析配置。
export default defineConfig({
  cacheDir: 'node_modules/.vite-dist',
  build: {outDir: 'dist'},
  server: {port: 3000, host: true, open: '/index.html'},
});
