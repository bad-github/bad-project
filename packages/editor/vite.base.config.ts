import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
import pkg from './package.json' with {type: 'json'};

// 两种库格式共用源码转换、样式处理和资源发布配置。
export default defineConfig({
  // 保留源码选择器，不在库构建时额外添加样式作用域。
  plugins: [react()],
  resolve: {
    alias: {
      '@workspace/editor': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    sourcemap: false,
    outDir: pkg.output,
    // 库产物不复制 public 中的演示图标等资源。
    copyPublicDir: false,
    // 两种格式均将样式汇总为 editor.css。
    cssCodeSplit: false,
    lib: {
      entry: pkg.source,
      name: 'TiptapEditor',
      cssFileName: 'editor',
    },
  },
});
