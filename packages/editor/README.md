# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## 编辑器与演示入口

演示应用采用本地预构建方式部署到 Vercel，完整命令与配置说明见 [Vercel 部署指南](./vercel-deploy.md)。

公共入口导出 `TiptapApp`、`TiptapAppProps`、`TiptapEditorRef` 和 `demoContent`。编辑器默认显示空文档和完整工具栏；需要示例内容时，显式传入 `demoContent`。

```tsx
import {TiptapApp, demoContent} from '@workspace/editor';
import '@workspace/editor/editor.css';

<TiptapApp initialContent="<p>初始内容</p>" />;
<TiptapApp initialContent={demoContent} />;
// 隐藏默认工具栏；也可将 toolbar 设置为自定义 React 节点。
<TiptapApp toolbar={null} />;
```

`initialContent` 接受 Tiptap 的 HTML / JSON 内容，仅用于初始化。后续替换内容可通过 ref 获取 editor，再调用 `editor.commands.setContent(...)`。自定义工具栏位于 EditorContext 内，可用 Tiptap 的 `useCurrentEditor()` 获取实例。

`src/main.tsx` 加载独立的 `src/demo/editor-demo.tsx`。`src/demo/content.ts` 中的示例数据通过公共入口导出，供第三方项目使用；演示页面和 submit 按钮不对外导出。

### 插入与格式命令菜单

在正文中输入 `!`（段落开头或空格之后），或点击工具栏的 `!` 按钮打开菜单。继续输入可按中文名称、英文关键词或分组搜索，例如 `!标题`、`!todo`、`!heading 2`。支持方向键选择、Enter 执行、Esc 关闭，长列表会跟随键盘选中项滚动。

菜单包含文本、列表、引用与代码、插入、文字格式、对齐与清理六组，共 33 个配置项。候选根据已注册扩展与当前选区过滤；图片复用现有上传节点，表情和提及分别转入已有 `:`、`@` 菜单。文字格式命令切换后续输入的格式。

配置与命令执行位于 `src/page/components/custom/suggestion/menu-items.ts`，展示位于同目录的 `suggestion-list.tsx`，`suggestion.tsx` 负责按钮和建议插件接入。新增命令时在配置中声明分组、搜索关键词、所需扩展和链式操作；触发文本由统一执行函数删除一次，无需在条目中额外删除。

### 内容变化、只读与回填

```tsx
import {useRef} from 'react';
import {TiptapApp, type TiptapEditorRef} from '@workspace/editor';

function ArticleEditor({readOnly = false}: {readOnly?: boolean}) {
  const editorRef = useRef<TiptapEditorRef | null>(null);
  return (
    <>
      <button onClick={() => editorRef.current?.setContent('<p>回填内容</p>', {emitUpdate: false})}>
        加载内容
      </button>
      <TiptapApp
        ref={editorRef}
        editable={!readOnly}
        onChange={({json, html}) => console.log(json, html)}
      />
    </>
  );
}
```

- `onChange` 返回 `{json: JSONContent, html: string}`（导出类型 `TiptapEditorChange`），文档更新时使用最新回调；初始化、选区变化和只读切换不会触发。
- `editable` 默认为 `true`，支持运行时切换，不重建编辑器或重置内容。只读时隐藏工具栏（含自定义工具栏）和表格操作控件，保留目录导航。只读限制用户编辑，宿主仍可通过 ref 更新内容。
- `setContent(content, options?)` 接受 HTML / JSON，返回 Tiptap 命令的布尔结果；编辑器未就绪或已销毁时返回 `false`。默认触发 `onChange`，传 `{emitUpdate: false}` 可静默回填；`parseOptions`、`errorOnInvalidContent` 沿用 Tiptap 选项，解析错误会继续抛出。
- `getJSON()` 的返回类型为 `JSONContent | undefined`。

### 根元素样式与实例状态

`className` 追加到编辑器根元素，保留内部布局类和 `tiptap-editor`；`style` 应用到同一个根元素，运行时更新或移除属性均会同步。可以通过 `ref.current.el` 获取该元素。

```tsx
<TiptapApp className="article-editor" style={{height: 600, padding: 0}} />;
```

主题、只读状态、内容和样式均属于各编辑器实例，不使用全局 Zustand store。`TiptapApp` 将外部属性统一交给 `TiptapEditorProvider`，内部通过 `provider/editor-provider.tsx` 的 `useTiptapEditor()` 读取所需配置，无需沿组件树逐层传递。Context 直接提供当前属性，不维护一份需要 effect 同步的配置副本。

## 库构建与运行时依赖

`build:lib` 先检查类型，再构建 ESM 和 UMD。`vite.base.config.ts` 维护公共配置，`vite.esm.config.ts` 和 `vite.umd.config.ts` 分别维护格式、依赖外置和专属插件；声明仅在 ESM 阶段生成。`vite.config.ts` 用于演示应用。

类型构建只为公共入口 `src/index.tsx`、组件入口 `src/App.tsx`、公共类型所在的 `src/provider/editor-provider.tsx` 和导出的 `src/demo/content.ts` 生成声明，再通过 `rollupTypes` 合并为 `dist-lib/types/index.d.ts`。不单独发布内部组件、演示页或未公开扩展的声明；新增公开类型依赖时，需要同步维护这份 include 清单。

ESM 外置 `dependencies` 和 `peerDependencies`，包含包子路径，使消费应用复用 Tiptap/ProseMirror 等依赖。外置依赖仍通过 dependencies 安装；第三方 CSS/SCSS 继续由 Vite 编译进 editor.css。StarterKit、Ariakit、Base UI、class-variance-authority 属于运行时依赖，放在 dependencies。

React、ReactDOM 声明为 peerDependencies，由消费应用提供同一实例；devDependencies 中保留它们供开发与构建使用。目前兼容范围沿用 `^19.2.4`。

编辑器公共源码入口标记为 `use client`；ESM 生成 `esm/index.mjs`，UMD 生成 `umd/index.cjs`，通过文件后缀区分模块格式。`package.json` 的 main、module 和 exports 指向对应产物，不再通过 publish-assets 插件写入目录级 package.json。Rolldown 保留源码入口的客户端指令，不再通过 postBanner 重复添加。当前整个编辑器作为客户端模块发布。库构建配置使用显式 .ts 导入及 JSON 导入属性，可由 Vite 原生配置加载器加载。

库构建保留源码 CSS 选择器，不额外添加 .tiptap-editor 前缀；弹层挂载方式保持不变。源码中的 :root、.dark 等全局规则仍会发布，消费应用需留意主题变量与全局样式冲突。

样式仅发布编译后的 `dist-lib/editor.css`，使用方统一导入 `@workspace/editor/editor.css`。不再复制 src/styles 或开放 styles/*，SCSS、演示用 global.css 和带源码别名的原始样式不会随包发布。主题变量与组件样式已经合并进 editor.css，演示应用仍从源码加载 global.css。

高亮只注册 HTML、CSS、JavaScript、TypeScript，保留 xml/javascript/typescript 别名，不再加载全量语言包。需要其他语言时，在高亮扩展中显式导入并注册相应语法。

库构建关闭 copyPublicDir，不复制 public 中的 favicon.svg 等演示资源；演示应用仍按原配置使用 public。cssCodeSplit 位于 build 层并设为 false，库样式汇总为 editor.css。

UMD 固定为生产环境，其他依赖打入单文件；React、ReactDOM 和 react/jsx-runtime 外置，页面需要先提供同版本的 `window.React`、`window.ReactDOM`、`window.ReactJSXRuntime`，随后通过普通 script 加载 `umd/index.cjs`，获得 `window.TiptapEditor`（包含 TiptapApp 和 demoContent），并通过 link 加载 editor.css。服务器需以 JavaScript MIME 类型提供 .cjs 文件。Node 使用 require 加载时，.cjs 会被识别为 CommonJS。使用 Rollup 官方 CommonJS 插件转换依赖中的 require，避免在浏览器运行时依赖 Node 的 require。

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```


pnpm create vite editor --template react-ts



## tiptap

安装核心依赖
- @tiptap/react
- @tiptap/pm 
- @tiptap/starter-kit

安装插件包

- pnpm add @tiptap/extension-document @tiptap/extension-paragraph @tiptap/extension-text
- pnpm add @tiptap/extension-bold
- pnpm add @tiptap/extension-blockquote
- pnpm add @tiptap/extension-italic
- pnpm add @tiptap/extension-strike
- pnpm add @tiptap/extension-code
- pnpm add @tiptap/extension-heading
- pnpm add @tiptap/extension-list
- pnpm add @tiptap/extension-code-block
- pnpm add @tiptap/extension-horizontal-rule
- pnpm add @tiptap/extension-underline
- pnpm add @tiptap/extension-subscript
- pnpm add @tiptap/extension-superscript
- pnpm add @tiptap/extension-image
- pnpm add @tiptap/extension-text-style
- pnpm add @tiptap/extension-highlight
- pnpm add @tiptap/extension-emoji
- pnpm add @tiptap/extension-link
- pnpm add @tiptap/extension-mention
- pnpm add @tiptap/extensions
- pnpm add @tiptap/extension-details
- pnpm add @tiptap/extension-hard-break
- pnpm add @tiptap/extension-mathematics
  - pnpm add katex
- pnpm add @tiptap/extension-audio
- pnpm add @tiptap/extension-twitch
- pnpm add @tiptap/extension-youtube
- pnpm add @tiptap/extension-code-block-lowlight
  - pnpm add lowlight
  - pnpm add highlight.js

运行cli生成代码

primitives
- npx @tiptap/cli@latest add avatar
- npx @tiptap/cli@latest add badge
- npx @tiptap/cli@latest add button
- npx @tiptap/cli@latest add card
- npx @tiptap/cli@latest add combobox
- npx @tiptap/cli@latest add dropdown-menu
- npx @tiptap/cli@latest add input
- npx @tiptap/cli@latest add label
- npx @tiptap/cli@latest add menu
- npx @tiptap/cli@latest add popover
- npx @tiptap/cli@latest add separator
- npx @tiptap/cli@latest add spacer
- npx @tiptap/cli@latest add textarea-autosize
- npx @tiptap/cli@latest add toolbar
- npx @tiptap/cli@latest add tooltip

开源
node
- npx @tiptap/cli@latest add blockquote-node
- npx @tiptap/cli@latest add code-block-node
- npx @tiptap/cli@latest add heading-node
- npx @tiptap/cli@latest add horizontal-rule-node
- npx @tiptap/cli@latest add image-node
- npx @tiptap/cli@latest add image-upload-node
- npx @tiptap/cli@latest add list-node
- npx @tiptap/cli@latest add paragraph-node

components
- npx @tiptap/cli@latest add heading-button
- npx @tiptap/cli@latest add heading-dropdown-menu
- npx @tiptap/cli@latest add list-dropdown-menu
- npx @tiptap/cli@latest add blockquote-button
- npx @tiptap/cli@latest add code-block-button
- npx @tiptap/cli@latest add text-align-button
- npx @tiptap/cli@latest add image-upload-button
- npx @tiptap/cli@latest add link-popover
- npx @tiptap/cli@latest add undo-redo-button
- npx @tiptap/cli@latest add mark-button
- npx @tiptap/cli@latest add color-highlight-button
- npx @tiptap/cli@latest add color-highlight-popover
- npx @tiptap/cli@latest add list-button



start plan
注册新账号可免费使用30天

node
- npx @tiptap/cli@latest add image-node-pro
- npx @tiptap/cli@latest add table-node
- npx @tiptap/cli@latest add toc-node

components
- npx @tiptap/cli@latest add text-button
- npx @tiptap/cli@latest add reset-all-formatting-button
- npx @tiptap/cli@latest add move-node-button
- npx @tiptap/cli@latest add emoji-trigger-button
- npx @tiptap/cli@latest add emoji-dropdown-menu
- npx @tiptap/cli@latest add mention-dropdown-menu
- npx @tiptap/cli@latest add mention-trigger-button
- npx @tiptap/cli@latest add slash-command-trigger-button
- npx @tiptap/cli@latest add slash-dropdown-menu
- npx @tiptap/cli@latest add color-text-popover
- npx @tiptap/cli@latest add ai-ask-button
- npx @tiptap/cli@latest add ai-menu
- npx @tiptap/cli@latest add copy-anchor-link-button
- npx @tiptap/cli@latest add copy-to-clipboard-button
- npx @tiptap/cli@latest add delete-node-button
- npx @tiptap/cli@latest add drag-context-menu
- npx @tiptap/cli@latest add duplicate-button
- npx @tiptap/cli@latest add image-align-button
- npx @tiptap/cli@latest add improve-dropdown
- npx @tiptap/cli@latest add turn-into-dropdown


utilities
- npx @tiptap/cli@latest add suggestion-menu
- npx @tiptap/cli@latest add floating-element











| 对比维度         | **Quill** 🪶                                   | **Tiptap** ✨                                                    |
| ---------------- | ---------------------------------------------- | ---------------------------------------------------------------- |
| **底层架构**     | 基于浏览器 `contenteditable` + 自研 Delta 模型 | 基于 **ProseMirror**，文档结构是严格的 JSON Schema 树            |
| **数据结构**     | Delta（JSON 格式，简单但不够灵活）             | ProseMirror Node Tree（更复杂，但高度可扩展）                    |
| **开箱即用**     | ✅ 自带 toolbar、主题，几乎零配置即可用        | ❌ 默认是“空壳”，需要加载扩展（Bold、Italic、List 等）           |
| **学习曲线**     | 平缓，上手快                                   | 较陡峭，需要理解 ProseMirror 的 Schema、Node、Mark、Command 等   |
| **扩展性**       | API 有限，定制功能受限                         | 高度可扩展，可自定义 Node / Mark / Command，能插入任意前端组件   |
| **复杂文档支持** | 列表、图片、表格支持有限                       | 原生支持复杂结构（表格、代码块、嵌套节点、任务列表、数学公式等） |
| **协作编辑**     | 无内置方案，需要自己集成                       | 与 **Y.js** 等库深度结合，天然支持多人协作、实时同步             |
| **国际化**       | 基本靠外部处理                                 | 基于插件机制，扩展性强，已有 i18n 社区方案                       |
| **社区与生态**   | 历史悠久，社区稳定，但更新频率较低             | 新兴、活跃，社区维护频繁，生态插件多                             |
| **性能**         | 中规中矩，适合中小体量文档                     | 更适合大体量、复杂文档场景                                       |
| **移动端体验**   | 兼容性好，成熟                                 | 兼容性依赖 ProseMirror，但适配度逐渐提升                         |
| **典型场景**     | 评论框、简单的文章编辑器、CMS                  | 知识库、协作文档、Notion/Confluence 类编辑器                     |

## SuggestionMenu

| 属性                   | 类型                                   | 默认值                     | 说明                                                                             |
| ---------------------- | -------------------------------------- | -------------------------- | -------------------------------------------------------------------------------- |
| **editor**             | `Editor \| null`                       | `undefined`                | Tiptap 编辑器实例，用来绑定在哪个编辑器里触发 suggestion。                       |
| **char**               | `string`                               | `"@"`                      | 触发 suggestion 的字符，例如 `@`、`/`。                                          |
| **items**              | `(props) => Item[] \| Promise<Item[]>` | `() => []`                 | 返回候选项的函数，可以是同步或异步，`props` 里包含 `query`（触发字符后的输入）。 |
| **children**           | `(props) => ReactNode`                 | `undefined`                | 渲染菜单内容的函数，通常用来自定义 React 元素。                                  |
| **floatingOptions**    | `Partial<UseFloatingOptions>`          | `undefined`                | 浮动菜单定位的额外配置（基于 `@floating-ui`）。                                  |
| **selector**           | `string`                               | `"tiptap-suggestion-menu"` | 菜单容器的 CSS 选择器。                                                          |
| **pluginKey**          | `string \| PluginKey`                  | `SuggestionPluginKey`      | ProseMirror 插件的唯一标识符，用来区分多个 suggestion 实例。                     |
| **allowSpaces**        | `boolean`                              | `false`                    | 是否允许在查询字符串里包含空格。                                                 |
| **allowToIncludeChar** | `boolean`                              | `false`                    | 是否把触发字符（`/` 或 `@`）包含进查询内容。                                     |
| **allowedPrefixes**    | `string[] \| null`                     | `[" "]`                    | 允许触发字符前出现的前缀字符。例如 `" "` 表示空格后输入 `/` 才能触发。           |
| **startOfLine**        | `boolean`                              | `false`                    | 是否只在一行开头触发 suggestion。                                                |
| **decorationTag**      | `string`                               | `"span"`                   | 用来标记 suggestion 查询部分的 HTML 标签。                                       |
| **decorationClass**    | `string`                               | `"suggestion"`             | 标记元素的 CSS class 名称。                                                      |
| **decorationContent**  | `string`                               | `""`                       | 装饰元素里的占位文本（通常为空）。                                               |

    pnpm add @tiptap-pro/extension-ai @tiptap/core @tiptap/extension-audio @tiptap/extension-blockquote @tiptap/extension-bold @tiptap/extension-code @tiptap/extension-code-block @tiptap/extension-code-block-lowlight @tiptap/extension-color @tiptap/extension-details @tiptap/extension-document @tiptap/extension-drag-handle-react @tiptap/extension-emoji @tiptap/extension-hard-break @tiptap/extension-heading @tiptap/extension-highlight @tiptap/extension-horizontal-rule @tiptap/extension-image @tiptap/extension-italic @tiptap/extension-link @tiptap/extension-list @tiptap/extension-mathematics @tiptap/extension-mention @tiptap/extension-paragraph @tiptap/extension-strike @tiptap/extension-subscript @tiptap/extension-superscript @tiptap/extension-table @tiptap/extension-table-of-contents @tiptap/extension-text @tiptap/extension-text-align @tiptap/extension-text-style @tiptap/extension-twitch @tiptap/extension-underline @tiptap/extension-unique-id @tiptap/extension-youtube @tiptap/extensions @tiptap/pm @tiptap/react @tiptap/suggestion
