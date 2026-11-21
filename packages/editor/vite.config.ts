import {defineConfig, loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {fileURLToPath} from 'url';

// https://vite.dev/config/
export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd());
  return {
    base: `/${env.VITE_APP_NAME}/`,
    plugins: [react()],
    resolve: {
      alias: {
        '@workspace/editor': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src'),
      },
    },
    build: {
      outDir: 'dist-app',
      rolldownOptions: {
        preserveEntrySignatures: false,
        output: {
          codeSplitting: {
            groups: [
              {
                debugName: 'vendor-by-package',
                // 每个模块由 name 明确归类，避免递归收集将 React 带进编辑器分组。
                includeDependenciesRecursively: false,
                name: (id) => {
                  // 兼容 Windows 路径，并取 pnpm 嵌套路径中最后一层 node_modules。
                  const normalizedId = id.replaceAll('\\', '/');
                  const marker = '/node_modules/';
                  const index = normalizedId.lastIndexOf(marker);
                  if (index === -1) return null;

                  const [name, scopedName] = normalizedId.slice(index + marker.length).split('/');
                  const packageName = name.startsWith('@') ? `${name}/${scopedName}` : name;

                  if (['react', 'react-dom', 'scheduler'].includes(packageName)) {
                    return 'react-vendor';
                  }

                  // UI 库按命名空间拆开，小型 UI 工具集中在一组。
                  if (packageName.startsWith('@ariakit/')) return 'ariakit-vendor';
                  if (packageName.startsWith('@radix-ui/')) return 'radix-vendor';
                  if (packageName.startsWith('@floating-ui/')) return 'floating-vendor';
                  if (packageName.startsWith('@base-ui/')) return 'base-ui-vendor';
                  const uiPackages = ['class-variance-authority', 'react-hotkeys-hook', 'react-textarea-autosize', 'is-hotkey'];
                  if (uiPackages.includes(packageName)) {
                    return 'ui-vendor';
                  }

                  // 专项功能先匹配，再处理通用的 @tiptap 包。
                  if (packageName === '@tiptap/extension-emoji') return 'emoji-vendor';
                  if (['lowlight', 'highlight.js'].includes(packageName)) return 'highlight-vendor';
                  if (['yjs', 'y-protocols', 'lib0', 'y-prosemirror', '@tiptap/y-tiptap'].includes(packageName)) {
                    return 'collab-vendor';
                  }
                  if (packageName.startsWith('prosemirror-')) return 'prosemirror-vendor';
                  if (packageName.startsWith('@tiptap/')) return 'tiptap-vendor';

                  // 剩余第三方依赖单独共享，避免被放进应用代码后形成反向引用。
                  return 'shared-vendor';
                },
              },
            ],
          },
        },
      },
    },
    preview: {
      host: true,
    },
  };
});

