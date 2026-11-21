# Storybook 开发指南

本文面向第一次使用 Storybook 的开发者，说明 `@workspace/ui-base` 当前的集成方式、配置边界和日常开发流程。项目使用 Storybook 10、React 和 Vite；具体版本以 `package.json` 与工作区锁文件为准。

本文位于仓库根目录 `docs/storybook.md`；除特别说明外，项目内路径均相对于 `packages/ui-base`。

## Storybook 的用途与基本概念

Storybook 是组件的独立开发与展示环境。可以直接查看一个组件的不同状态，不必先启动业务应用、进入指定路由或准备业务数据。

| 概念      | 含义                                   | 本项目示例                         |
| --------- | -------------------------------------- | ---------------------------------- |
| Component | 实际交付给业务应用的 React 组件        | `Button`、`Input`                  |
| Story     | 一个组件在特定参数和环境下的示例       | 禁用按钮、密码输入框               |
| Meta      | 一个 stories 文件共用的元信息          | 分类、组件、默认参数、文档说明     |
| Canvas    | 单个 Story 的组件预览画布              | 点击“邮箱”后显示的输入框           |
| Docs      | 汇总说明、示例、属性表和代码的文档页面 | 点击组件下的“Docs”                 |
| Addon     | 扩展 Storybook 功能的插件              | `@storybook/addon-docs`            |
| Decorator | 给 Story 增加外层布局或上下文          | `PreviewUiBase` 提供 ThemeProvider |

Story 通常是一个导出的配置对象，不要求再创建一套组件实现。组件代码保留在 `src`，Story 只描述它如何展示。[Story 基础](https://storybook.js.org/docs/writing-stories)

## 页面布局与控制边界

### Manager 与 Preview

整个页面由两个环境组成：外层 **Manager** 提供导航和工具面板，中间的 **Preview iframe** 渲染组件或文档。它们有各自的页面、React 上下文和样式环境。

```text
Storybook 页面（Manager）
├── 左侧：分类、组件、Docs 和 Stories 导航
├── 顶部：预览工具栏、自定义界面主题按钮
├── 中间：Preview iframe
│   ├── Canvas：一个组件示例
│   └── Docs：文档外壳及其中的组件示例
└── 右侧或底部：Controls / Actions / Interactions 等插件面板
```

| 页面区域          | 渲染环境                            | 内容或行为由谁决定                                                          | 主题由谁决定                                           |
| ----------------- | ----------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------ |
| 左侧菜单          | Manager                             | Story 的 `title`、导出和 `name`；扫描规则在 `main.ts`；排序在 `preview.tsx` | `manager.ts` 初始化，`theme/manager-theme.ts` 应用主题 |
| 顶部工具栏        | Manager                             | 内置工具及 `addons.add()` 注册的扩展                                        | Manager 主题；自定义按钮也可有自己的样式               |
| Controls 面板     | Manager                             | `args`、`argTypes`、`parameters.controls`                                   | Manager 主题                                           |
| Actions 面板      | Manager                             | Story 中的回调记录，例如 `fn()`                                             | Manager 主题及插件自身样式                             |
| Interactions 面板 | Manager                             | Story 的 `play` 执行信息与测试集成                                          | Manager 主题                                           |
| Canvas 组件预览   | Preview iframe                      | Story 的组件、`args`、`render`、装饰器                                      | 组件 CSS 和 `PreviewUiBase` 中的 ThemeProvider         |
| Docs 文档外壳     | Preview iframe                      | Autodocs、MDX、文档参数与容器                                               | 当前使用 `theme/docs-container.tsx`                    |
| Docs 中的组件示例 | Preview iframe，部分示例另开 iframe | 对应 Story 和装饰器                                                         | 组件 CSS 与 Provider，不由文档外壳主题自动切换         |

“Controls / Actions / Interactions”是插件面板的标签，并非一套独立的状态栏。面板可以在右侧或底部，位置属于 Manager 布局配置；标签是否出现取决于可用插件和功能。

`preview.tsx` 也能配置导航排序、Controls 行为，是因为这些参数会被 Storybook 消费。不能简单理解为“写在 Preview 文件中的配置只影响中间画布”。

### Canvas 与 Docs 的区别

点击“默认”“禁用”“邮箱”等 Story，进入 Canvas，只展示这个示例。点击“Docs”，进入文档页，显示标题、描述、属性表以及多个示例。

`parameters.docs.theme` 控制 Docs 的文档外壳，不控制普通 Canvas，也不会自动给组件添加 `.dark` 类。Manager 与 Docs 使用 Storybook 的主题体系，但配置入口独立。[官方主题说明](https://storybook.js.org/docs/configure/user-interface/theming)

## 配置目录与运行流程

### 当前目录结构

```text
packages/ui-base/
├── .storybook/
│   ├── main.ts
│   ├── manager.ts
│   ├── preview.tsx
│   ├── start.mjs
│   ├── preview-ui-base/
│   │   ├── preview-ui-base.tsx
│   │   └── index.css
│   └── theme/
│       ├── manager-theme.ts
│       ├── theme-state.ts
│       ├── theme-tool.tsx
│       ├── docs-container.tsx
│       ├── preview-theme.ts
│       └── loading.css
├── src/
│   ├── components/ui/
│   │   ├── button.tsx
│   │   ├── button.stories.tsx
│   │   ├── input.tsx
│   │   └── input.stories.tsx
│   └── provider/
│       ├── theme-provider.tsx
│       └── theme-provider.stories.tsx
└── tsconfig.storybook.json
```

### 官方约定与项目自定义文件

| 文件或目录                | 是否为官方约定   | 用途                                                         |
| ------------------------- | ---------------- | ------------------------------------------------------------ |
| `.storybook/`             | 是，默认配置目录 | CLI 默认从这里读取配置，可通过 `--config-dir` 指定其他目录   |
| `main.ts`                 | 是               | 配置扫描规则、框架、插件和构建扩展，主要在启动与构建阶段运行 |
| `manager.ts`              | 是               | 进入浏览器的 Manager 环境，配置界面和注册工具                |
| `preview.tsx`             | 是               | 进入 Preview 环境，配置装饰器、参数和预览初始化              |
| `start.mjs`               | 否               | 本项目对官方 CLI 的启动封装，当前由 npm script 调用          |
| `preview-ui-base/`        | 否               | 本项目的组件预览环境与样式                                   |
| `theme/`                  | 否               | 本项目的 Storybook 界面主题实现                              |
| `tsconfig.storybook.json` | 否               | 本项目为 Storybook 配置文件提供 TypeScript 检查              |

除了约定入口，其他文件都需要显式导入或调用才会生效。例如 `theme/loading.css` 通过 `preview-theme.ts` 导入，`preview.tsx` 再调用它的初始化函数。[配置约定](https://storybook.js.org/docs/configure/index)

### 启动时发生什么

```text
pnpm storybook
→ package.json 的 storybook script
→ 当前项目的 .storybook/start.mjs
→ storybook dev，传入端口和 --no-open
→ 读取 main.ts，加载框架、插件，扫描 Stories
→ 构建并加载 Manager，执行 manager.ts
→ 加载 Preview iframe，执行 preview.tsx 及其依赖
→ 执行装饰器，渲染选中的 Canvas 或 Docs
```

启动命令会读取 `main.ts`，但 `main.ts` 不是业务应用入口。Storybook 也不会自动执行 `src/main.tsx` 或 `App.tsx`，需要的 Provider、字体、CSS 应在预览配置中接入。

### Vite 的职责

本项目通过 `@storybook/react-vite` 使用 React 渲染和 Vite 构建。Storybook 会读取、合并项目的 Vite 配置，因此已有的 React 插件、Tailwind 插件及 `@ui-base` 别名可以复用。

Storybook 服务的启动端口和是否打开浏览器由它自己的 CLI 管理，不能用 `vite.config.ts` 的 `server.port`、`server.open` 来替代。只针对 Storybook 的 Vite 构建修改，可以写在 `main.ts` 的 `viteFinal` 中。[Vite Builder](https://storybook.js.org/docs/builders/vite)

## 集成到 ui-base 的完整流程

### 在工作区子包中初始化

在 `packages/ui-base` 目录执行：

```bash
pnpm create storybook@latest --features docs --yes --no-dev --package-manager pnpm
```

这是重新集成时的参考命令；已完成集成的项目无需重复执行。CLI 的自动生成内容可能随版本变化，执行后应检查变更。

本项目的开发依赖包括 `storybook`、`@storybook/react-vite`、`@storybook/addon-docs` 和 `eslint-plugin-storybook`。依赖声明放在子包，安装和锁文件由根工作区统一维护，不创建子包自己的 workspace 或锁文件。

### 清理脚手架示例

移除生成的示例 Button、Header、Page 和示例图片等，保留实际需要的配置和脚本。后续 Stories 直接展示 `src` 中自己维护的组件，避免与脚手架的同名组件混淆。

### 配置扫描规则与插件

在 `main.ts` 中配置：

```ts
stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
addons: [getAbsolutePath('@storybook/addon-docs')],
framework: getAbsolutePath('@storybook/react-vite'),
```

扫描路径相对于 `.storybook` 配置目录。当前允许 Stories 放在组件旁边，也允许 MDX 放在 `src` 内。

`getAbsolutePath()` 使用 `import.meta.resolve()` 定位已安装包，再取包目录，帮助 CLI 在工作区中找到框架和插件。它与源码别名 `@ui-base` 的用途不同。

### 接入组件样式与 Provider

创建 `preview-ui-base/index.css`，导入组件源码样式和字体，并补充 Tailwind 扫描：

```css
@import '../../src/styles/index.css';
@import '../../src/styles/font.css';

@source './';
@source '../../src/**/*.stories.*';
@source '../../src/**/*.mdx';
```

这些路径相对于这个 CSS 文件。移动文件目录后，`@import` 和 `@source` 都要检查。Storybook 开发直接使用源码，不要求先生成 `dist-lib`。

创建 `PreviewUiBase` 装饰器，在组件外包裹 ThemeProvider，再在 `preview.tsx` 中注册：

```tsx
import type {Decorator} from '@storybook/react-vite';
import {ThemeProvider} from '@ui-base/provider';

const PreviewUiBase: Decorator = (Story) => (
  <ThemeProvider defaultTheme="system" storageKey="storybook-preview-theme">
    <Story />
  </ThemeProvider>
);
```

上面展示的是最小结构，当前实际实现还包含 ThemeSwitch。`Story` 是当前示例的渲染函数；`context` 提供 `viewMode`、`args`、`globals`、`parameters` 等信息。`context.viewMode` 可以区分普通故事与文档。

```tsx
decorators: [PreviewUiBase],
```

在 Manager 注册的组件无法直接读取 Preview iframe 的 React Context。需要共享选择时，应通过事件、globals 或存储机制沟通，不能假设两边共用同一个 Provider。

### 接入 TypeScript 与 ESLint

`tsconfig.storybook.json` 继承应用配置，获得源码别名和 `vite/client` 的 CSS 类型声明：

```json
{
  "extends": "./tsconfig.app.json",
  "include": [".storybook/**/*.ts", ".storybook/**/*.tsx"]
}
```

在根 `tsconfig.json` 的 `references` 中引用它，让编辑器发现这个配置；同时在 `typecheck` 脚本中执行它。

本项目 ESLint 启用 `storybook.configs['flat/recommended']`，并忽略 `storybook-static/**`。`tsconfig.lib.json` 排除 `src/**/*.stories.*`，Story 也不从组件库入口导出，从而避免把开发文档纳入库的声明产物。

### 配置开发与构建命令

官方最小脚本可以直接写为：

```json
{
  "storybook": "storybook dev --port 6006 --no-open",
  "build-storybook": "storybook build"
}
```

当前仓库仍采用 `node .storybook/start.mjs` 启动，里面集中维护 `port` 和 `openBrowser`，最终调用相同的官方 CLI。这是项目封装，不是 Storybook 自动识别的配置文件；上述直接命令是更简单的可选形式。

| 官方启动参数              | 含义                                           |
| ------------------------- | ---------------------------------------------- |
| `--port 6006`             | 设置服务端口                                   |
| `--no-open`               | 不自动打开浏览器                               |
| `--host 127.0.0.1`        | 设置监听地址；需要局域网访问时可使用 `0.0.0.0` |
| `--exact-port`            | 端口被占用时直接退出，不使用其他端口           |
| `--config-dir .storybook` | 指定配置目录                                   |
| `--smoke-test`            | 服务成功启动后退出，用于启动检查               |

端口和自动打开浏览器不是 `main.ts` 的配置字段。[官方 CLI 参数](https://storybook.js.org/docs/api/cli-options)

### 忽略构建产物并验证集成

将 `storybook-static/` 加入 Git、Prettier 和 ESLint 的忽略范围。运行类型检查、Lint 和 Storybook 构建，再打开开发页面验证导航、组件样式、Controls 和 Docs。

组件库构建、示例应用构建、Storybook 构建是不同任务：`dist-lib` 用于交付组件，`dist-app` 用于示例应用，`storybook-static` 用于组件文档网站。

## 开发一个组件 Story

### 准备组件与导出

组件应先在 `src/components/ui/` 中实现，并在对应目录的 `index.ts` 导出。添加 shadcn 组件时，在子包执行：

```bash
pnpm dlx shadcn@latest add input
```

本项目 `components.json`、TypeScript 和 Vite 使用 `@ui-base` 源码别名；对外包名仍是 `@workspace/ui-base`。生成组件与编写 Story 是两个步骤，shadcn 不会自动补齐本项目的 Stories。

### 创建 stories 文件与 Meta

在组件旁创建 `组件名.stories.tsx`。例如以下内容是 Button Story 的最小参考，已有 `button.stories.tsx` 无需覆盖：

```tsx
import type {Meta, StoryObj} from '@storybook/react-vite';
import {fn} from 'storybook/test';
import {Button} from './button';

const meta = {
  title: 'components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {layout: 'centered'},
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'],
      description: '按钮样式。',
    },
    disabled: {control: 'boolean', description: '是否禁用。'},
    onClick: {control: false, description: '点击回调。'},
  },
  args: {
    children: '按钮',
    variant: 'default',
    disabled: false,
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {name: '默认'};
export const Outline: Story = {name: '描边', args: {variant: 'outline'}};
export const Disabled: Story = {name: '禁用', args: {disabled: true}};
```

默认导出是 Meta，命名导出是各个 Story。`satisfies Meta<typeof Button>` 检查配置与组件属性是否兼容，`StoryObj<typeof meta>` 保留默认参数的类型信息。

### 区分常用配置项

| 配置项       | 用途                             | 会直接作为组件 props 吗          |
| ------------ | -------------------------------- | -------------------------------- |
| `title`      | 导航路径，如 `components/Button` | 否                               |
| `component`  | 实际展示的组件，同时用于推断属性 | 否                               |
| `tags`       | 标记功能，例如 `autodocs`        | 否                               |
| `args`       | 示例的 props 值                  | 默认会；自定义 render 时需要传递 |
| `argTypes`   | 属性说明、控件类型和可选值       | 否                               |
| `parameters` | 布局、文档、Controls 等展示配置  | 否                               |
| `render`     | 自定义示例渲染                   | 接收 args，由你决定如何传给组件  |
| `decorators` | Provider、布局等外层环境         | 否                               |
| `name`       | 当前 Story 的菜单显示名称        | 否                               |
| `play`       | 渲染后运行的交互步骤或断言       | 否                               |
| `globals`    | Storybook 全局选择，如工具栏状态 | 不会自动变成 props               |

### 配置分类与排序

当前约定为 `components/组件名`、`provider/名称` 和 `hooks/名称`。`title` 中的 `/` 形成导航层级；`name` 可使用中文，导出名保持清晰的英文标识。

`preview.tsx` 使用 `storySort.order: ['guides', '*']`，将开发指南分类固定在最前面；`*` 表示其他未指定的分类，它们继续按 `method: 'alphabetical'` 排序。同一个组件内的 Story 默认保留声明顺序；如需连 Story 名称也排序，可以进一步配置 `includeNames`。

标题和导出名还会影响 Story ID 与 URL。改名后，旧的收藏链接可能失效。

### 添加具有代表性的状态

先覆盖组件最常用的状态：默认、禁用、错误、不同尺寸、带图标等。每个 Story 应回答一个明确问题，不必把所有参数组合都列出来。

复杂布局使用 `render`，并传递 `args`，否则 Controls 的变化可能不会影响组件：

```tsx
export const InContainer: Story = {
  name: '容器中的按钮',
  render: (args) => (
    <div style={{width: 320}}>
      <Button {...args} />
    </div>
  ),
};
```

`parameters.layout` 可选 `centered`、`padded`、`fullscreen`，控制 Canvas 布局；它不控制右侧 Controls 表格的垂直对齐。

### 配置 Controls 与 Actions

Controls 通过 args 编辑示例参数，不会修改组件源文件。常用 `control` 包括 `text`、`boolean`、`number`、`select`、`color`、`date`；`options` 提供枚举值。

`parameters.controls.include/exclude` 用于筛选属性，`sort` 控制属性排列，`expanded` 显示更多属性说明。全局 matchers 是识别规则，针对某个属性的 `argTypes.control` 可以明确指定控件。[Controls 配置](https://storybook.js.org/docs/essentials/controls)

回调使用 `fn()`，可以在 Actions 面板查看调用，也能用于交互断言。`control: false` 关闭参数编辑，并不移除它的文档行；要隐藏文档行可设置 `table.disable: true`。[Actions 说明](https://storybook.js.org/docs/essentials/actions)

Input 的 `defaultValue` 只在挂载时生效。当前 Input Story 根据 `type/defaultValue` 设置 key，让 Controls 修改初始值时重新挂载。受控示例则需要同时维护 `value` 和更新回调，不能只写一个固定 `value`。

### 验证 Story

检查导航分类和名称，调整 Controls，触发交互并查看 Actions，再检查 Docs 的描述、默认值和代码。最后运行类型检查、Lint 与静态构建。

需要验证交互行为时，可以加入 `play`。以下是追加到 Button 示例中的参考：

```tsx
import {expect, userEvent, within} from 'storybook/test';

export const Clickable: Story = {
  name: '点击交互',
  play: async ({canvasElement, args}) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', {name: '按钮'}));
    await expect(args.onClick).toHaveBeenCalled();
  },
};
```

这是浏览器中的交互检查。`storybook build` 仅证明文档可以构建，不会自动执行所有交互或证明视觉效果正确。当前 ui-base 已接入官方 Vitest addon，通过 `pnpm --filter @workspace/ui-base test:storybook` 在 Playwright Chromium 中运行 Stories；各组件的代表性 Story 已包含交互或内容断言，暂未接入 CI。本文的测试代码用于说明编写方式。

## Story 语法详解（CSF 3）

本项目使用 **CSF 3（Component Story Format）**：以 ES 模块组织示例，默认导出 Meta，命名导出 Story 对象。文件使用 `.stories.tsx` 后缀，因为示例经常需要 JSX。以下说明对应当前仓库的写法，不需要迁移到其他 Story 格式。[官方 Story 写法](https://storybook.js.org/docs/writing-stories/index)

### 一个完整文件应该怎样读

```tsx
import type {Meta, StoryObj} from '@storybook/react-vite';
import {fn} from 'storybook/test';
import {Button} from './button';

const meta = {
  title: 'components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    controls: {include: ['children', 'variant', 'disabled', 'onClick']},
    docs: {
      description: {component: '用于触发操作的按钮。'},
    },
  },
  argTypes: {
    children: {control: 'text', description: '按钮文字。'},
    variant: {
      control: 'select',
      options: ['default', 'outline'],
      description: '按钮样式。',
      table: {defaultValue: {summary: 'default'}},
    },
    disabled: {control: 'boolean', description: '是否禁用。'},
    onClick: {control: false, description: '点击回调。'},
  },
  args: {
    children: '保存',
    variant: 'default',
    disabled: false,
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {name: '默认'};
export const Disabled: Story = {
  name: '禁用',
  args: {disabled: true},
};
```

这份代码的读取顺序是：先找到 `component`，知道展示哪个组件；再看 `args`，知道默认传什么值；然后查看各个命名导出，知道有哪些场景，以及它们覆盖了哪些默认值。`parameters` 和 `argTypes` 负责展示环境与编辑方式。

| 代码                                   | 具体含义                                                                                      |
| -------------------------------------- | --------------------------------------------------------------------------------------------- |
| `import type {...}`                    | 只导入 TypeScript 类型，不是运行时组件，不会在浏览器中生成对应 import。                       |
| `Meta`                                 | Meta 配置的类型，约束组件、参数和渲染函数等字段。                                             |
| `StoryObj`                             | CSF 3 Story 对象的类型，不是 React 组件类型。                                                 |
| `const meta = {...}`                   | 创建本文件所有 Story 共用的配置对象；变量名可以不同，本项目统一叫 `meta`。                    |
| `typeof Button`                        | 在类型位置获取 Button 的类型，让 Storybook 推断其 props。不是调用 Button。                    |
| `satisfies Meta<typeof Button>`        | 检查对象符合 Meta 规则，同时保留对象自身较精确的推断类型；不会改变运行时行为。                |
| `export default meta`                  | 将 Meta 作为本模块唯一的默认导出，供 Storybook 建立分类和组件信息。                           |
| `typeof meta`                          | 获取已经定义好的 Meta 对象类型，其中包含默认 args 的信息。                                    |
| `type Story = StoryObj<typeof meta>`   | 创建本地类型别名，后续每个示例都使用相同规则检查。                                            |
| `export const Disabled: Story = {...}` | 创建名为 Disabled 的命名导出。Storybook 会将它识别为一个示例。冒号后的 Story 只用于类型检查。 |
| `{name: '默认'}`                       | 使用 Meta 的默认参数和渲染方式，只修改菜单中的可见名称。                                      |

默认导出回答“这是一组什么示例”，命名导出回答“这一组具体有哪些示例”。普通辅助函数不要随意 `export`，否则可能被索引为 Story。共享工具应放在其他模块，确实需要额外导出时再配置 `includeStories` 或 `excludeStories`。

`StoryObj<typeof meta>` 能知道哪些必填参数已经由 Meta 提供。例如 `ChartContainer` 要求 `config` 和 `children`，本项目在 Meta 给出默认值，单个 Story 就不必重复声明。类型检查仍然会检查传错的属性。[TypeScript 说明](https://storybook.js.org/docs/configure/integration/typescript)

### title、导出名、name 分别控制什么

```tsx
// Meta
title: 'components/AlertDialog';

// 命名导出
export const Default: Story = {name: '默认'};
```

`title` 使用 `/` 划分导航层级，这里表示 `components → AlertDialog`。它是 Storybook 的分类，不决定磁盘路径，也不要求与组件函数名相同：`chart.stories.tsx` 使用 `components/Chart`，实际 `component` 是 `ChartContainer`。

`Default` 是 JavaScript 导出名，也是生成 Story ID 的依据之一；`name` 是导航中显示的名称。该示例通常生成 `components-alertdialog--default` 这样的 ID。中文显示名称不会要求你把导出变量改为中文。改动 `title` 或导出名时应检查收藏和文档引用的链接。

### component、subcomponents 与复合组件

`component: Button` 提供默认渲染目标，也为属性分析提供信息。没有自定义 `render` 时，可以把默认行为理解为 `<Button {...args} />`。

弹层和表单通常由多个子组件组合，例如 `Dialog + DialogTrigger + DialogContent + DialogTitle`。这些子组件需要上下文，不能简单地将 `DialogTitle` 单独摆在页面上。本项目以一个组件模块对应一个 Story 文件，在完整组合中展示子组件。

需要补充子组件属性文档时可以声明 `subcomponents: {DialogTrigger, DialogContent}`。这只帮助生成文档，不会自动创建 Story、装配组件或把子组件参数接入 Controls；复杂泛型组件的自动属性推断也可能不完整。[多组件 Story](https://storybook.js.org/docs/writing-stories/stories-for-multiple-components)

### args：真正驱动演示的值

`args` 是当前 Story 的输入数据。默认渲染时它们作为 props；自定义 `render` 时由函数决定如何使用。适合放文字、布尔值、数字、数组和普通对象，方便 Controls 编辑和 URL 同步；JSX 可以在代码中使用，但不适合作为任意可编辑的 JSON。

```tsx
// Meta：所有示例的默认值
args: {children: '保存', variant: 'default', disabled: false}

// Disabled Story：只覆盖 disabled
args: {disabled: true}
```

最终 Disabled 示例仍显示“保存”，样式仍为 `default`，只有 `disabled` 变为 `true`。用户在 Controls 中修改值后，当前示例会重新渲染，源代码不会被改写。相同参数名以更具体的 Story 配置为准，不要依赖嵌套业务对象的隐式合并；需要保留嵌套字段时显式展开。

回调 `fn()` 是测试间谍，用于记录调用参数和做断言。它本身不会替你执行保存或更新 `checked`，交互逻辑仍需要明确实现。[Args 说明](https://storybook.js.org/docs/writing-stories/args)

### argTypes：参数应该怎样编辑和解释

`argTypes` 不是一组新的参数值，而是 args 的说明书：

```tsx
argTypes: {
  variant: {
    control: 'select',
    options: ['default', 'outline'],
    description: '按钮的视觉样式。',
    table: {
      category: '外观',
      defaultValue: {summary: 'default'},
    },
  },
}
```

| 字段                                                   | 含义                                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `control: 'select'`                                    | 用下拉框编辑值。`text` 编辑文字，`boolean` 编辑开关，`number` 编辑数值，`object` 编辑对象或数组。 |
| `options`                                              | 下拉选项；应与组件实际支持的枚举值一致。                                                          |
| `control: {type: 'number', min: 0, max: 100, step: 1}` | 控件配置对象，比单个字符串更详细。只是编辑器约束，不能代替组件的业务校验。                        |
| `description`                                          | 显示在文档中的参数含义，建议说明单位、边界或使用条件。                                            |
| `table.category`                                       | 将参数放入属性表中的某个分组。                                                                    |
| `table.defaultValue.summary`                           | 记录组件默认值的文档文字，不会设置实际 args。                                                     |
| `control: false`                                       | 禁止编辑该参数，但仍可保留说明行。适用于事件回调。                                                |
| `table.disable: true`                                  | 从属性表中隐藏该行。不会删除组件的 prop。                                                         |

例如组件本身默认 `disabled=false`，但某个 Story 设置 `args.disabled=true`：文档仍可以说明组件默认值是 false，Canvas 则显示禁用状态。这两个位置表达的内容不同。

### parameters：配置预览和插件

`parameters` 不会自动成为组件 props。它配置 Storybook 或插件的行为，参数是否有效取决于相应功能是否已经接入。

| 写法                                        | 含义                                                                        |
| ------------------------------------------- | --------------------------------------------------------------------------- |
| `layout: 'centered'`                        | 在画布中居中展示，适合按钮、输入框。                                        |
| `layout: 'padded'`                          | 保留画布默认内边距。                                                        |
| `layout: 'fullscreen'`                      | 取消默认边距，适合 Sidebar 这类完整布局。                                   |
| `controls.include: ['variant', 'disabled']` | 仅展示这些参数的编辑项。                                                    |
| `controls.exclude: ['children']`            | 排除指定编辑项。                                                            |
| `controls.disable: true`                    | 关闭该示例的 Controls 面板。                                                |
| `docs.description.component`                | 组件级说明，通常显示在 Docs 标题附近。                                      |
| `docs.description.story`                    | 单个 Story 的说明，适合解释这个场景的特殊行为。                             |
| `docs.story.inline: false`                  | Docs 中的示例使用独立 iframe，避免 fixed 布局、Portal、快捷键监听互相影响。 |
| `docs.story.height: '420px'`                | 设置 Docs 中示例 iframe 高度，不是组件 CSS 高度，也不是浏览器视口宽度。     |
| `docs.source.code`                          | 显式给出文档中的使用代码，仅用于展示，不执行该字符串。                      |
| `docs.source.language: 'tsx'`               | 设置展示代码的高亮语言。                                                    |

全局参数位于 `.storybook/preview.tsx`，Meta 参数作用于本文件，单个 Story 参数只作用于它自己。对象型 `parameters` 会按 Storybook 的规则合并，数组通常作为配置值替换；不要把它理解成每层重写整份配置。[Parameters 说明](https://storybook.js.org/docs/writing-stories/parameters)

### render：组合组件与 JSX 语法

```tsx
render: (args) => (
  <div className="w-80">
    <Button {...args} />
  </div>
),
```

`(args) => (...)` 是箭头函数，接收当前参数，圆括号内的 JSX 是返回值。`{...args}` 是 JSX 属性展开，将 args 中的字段传给组件。只写 `<Button />` 会忽略 Controls 中的参数。

属性顺序会影响结果：`<Button {...args} disabled />` 始终禁用，因为后面的属性覆盖展开值；`<Button disabled {...args} />` 则允许 args 中的 disabled 覆盖前面的值。覆盖时要知道哪些属性属于演示，哪些允许用户调整。

`<>...</>` 是 Fragment，用来返回多个元素而不增加 DOM 容器。`items.map(item => <Item key={item.id} />)` 为每条数据生成元素，`key` 帮助 React 识别列表身份，不会成为 Item 的普通 props。`{condition && <Error />}` 按条件显示组件；`condition ? A : B` 表示二选一。

复杂例子可以拆为本文件内的 `function Example()`，再写 `render: () => <Example />`。辅助组件使用 PascalCase，React Hook 放在 React 组件或自定义 Hook 内，不能在模块顶层调用。

### 受控状态、useArgs、defaultValue 和 key

下面是当前 Checkbox Story 使用的模式：

```tsx
import type {ComponentProps} from 'react';
import {useArgs} from 'storybook/preview-api';

render: function Render(args) {
  const [{checked}, updateArgs] = useArgs<ComponentProps<typeof Checkbox>>();

  return (
    <Checkbox
      {...args}
      checked={checked}
      onCheckedChange={(value, details) => {
        args.onCheckedChange?.(value, details);
        updateArgs({checked: value});
      }}
    />
  );
},
```

`ComponentProps<typeof Checkbox>` 提取组件 props 类型。`useArgs()` 的第一个返回值是当前参数对象，第二个返回值是更新参数的方法；`[{checked}, updateArgs]` 通过数组和对象解构取出所需字段。点击后 `updateArgs({checked: value})` 更新演示，也同步 Controls。

`args.onCheckedChange?.(...)` 使用可选调用：回调存在时才执行。先调用 Meta 配置的 `fn()`，再更新参数，既能保留 Actions 记录，也能让复选框切换。Base UI 回调可能提供第二个 `details` 参数，本项目保留并转发它。

仅传 `checked={false}` 而不更新它，会让组件一直停留在未选中状态。只用 `useState` 也可以维护演示，但状态不会自动回写 Controls；本项目的菜单、分页和问卷使用本地 state，Checkbox、Switch、Slider 等使用 `useArgs` 同步可编辑参数。

`defaultValue`、`defaultChecked`、`defaultOpen` 是首次挂载的初始值，后续改变它们不保证组件重新初始化。Collapsible Story 使用 `key={String(args.defaultOpen)}`：当初始展开参数变化时，React 将示例卸载并重新挂载，因此演示的其他本地状态也会重置。`key` 是 React 的身份标记，不是组件 prop。

Base UI Select、Combobox 等带泛型的组件，或 InputOTP 的互斥 props，在 Story 中可能需要额外类型说明；不要为消除错误使用 `any`。例如 InputOTP 已使用 children 组织槽位，便明确 `render={undefined}`，避免同时启用另一套 render API。

### decorators：让示例获得上下文

```tsx
decorators: [
  (Story, context) => (
    <div className={context.args.disabled ? 'opacity-75' : ''}>
      <Story />
    </div>
  ),
],
```

`Story` 是当前故事的渲染入口，用 `<Story />` 执行；遗漏它就只剩装饰器容器。`context` 是 Storybook 提供的上下文，不是组件 props，可以读取 `args`、`globals`、`parameters`、`viewMode` 等。

装饰器适合反复使用的 Provider、固定容器、路由或模拟数据环境。只服务于单个示例的布局通常直接写在 `render` 中。项目全局已经接入 ThemeProvider；Tooltip、Toast、MessageScroller 等专用 Provider 在对应组合内提供，且通知管理器使用每个示例独立的实例。[Decorators 说明](https://storybook.js.org/docs/writing-stories/decorators)

### play：渲染后的交互与断言

`play` 用来描述“渲染之后用户做什么、期望看到什么”。它不会改变组件实现；静态构建成功也不表示 play 已经执行。下面是可添加到 Checkbox 文件中的参考：

```tsx
import {expect, userEvent, within} from 'storybook/test';

export const ToggleByClick: Story = {
  name: '点击切换',
  args: {checked: false},
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');
    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();
  },
};
```

`async` 允许函数使用 `await`；`await` 等待操作或断言完成后再继续。`within(canvasElement)` 将查询范围限制在当前画布，避免误选 Docs 中其他示例。`getByRole` 通过无障碍角色查找实际控件，优先使用角色、标签和可见名称，减少对 CSS 结构的依赖。

Dialog、Select 等通过 Portal 将内容挂到当前 iframe 的 body，可能超出 `canvasElement` 的子树。测试它们时，应从 `canvasElement.ownerDocument.body` 建立查询范围，而不是从 Manager 页面或整个浏览器全局 document 查找。关闭动画和异步加载需要等待元素状态稳定，不要以固定延迟代替结果断言。

当前项目通过 `vitest.config.ts` 中的 `storybook` 测试项目批量运行 Stories，并自动复用 Preview 配置；没有 `play` 时执行渲染检查，有 `play` 时同时执行交互断言。单次运行使用 `test:storybook`，监听模式使用 `test:storybook:watch`；具体命令见 `packages/ui-base/README.md`。不能仅看编译结果就认为测试通过。

### tags 与辅助配置

`tags: ['autodocs']` 让已启用的 Docs 功能为该组件生成文档入口，不等于自动写出组件用法或自动生成各状态的 Story。`subcomponents`、`argTypes` 和说明文字仍需维护。

`globals` 表示共享工具栏选择，`args` 表示当前示例输入；定义 globals 不会自动传给组件。需要数据时可以使用 `loaders` 异步准备，再从渲染上下文的 `loaded` 读取；本项目的示例优先使用固定本地数据，方便离线预览、构建和复现。

### 当前覆盖范围与维护方法

`src/components/ui` 的 63 个组件模块各有同名 `.stories.tsx`，继续使用 `components/名称` 分类；另外提供 `hooks/useIsMobile`、`hooks/useHighlightedCode`、`lib/highlighter` 和 `provider/ThemeProvider`。子组件在所属模块的组合示例中展示，而非每个导出函数都单建导航项。

| 组件类型   | 代表文件                                                            | 编写重点                                              |
| ---------- | ------------------------------------------------------------------- | ----------------------------------------------------- |
| 展示与布局 | `badge`、`card`、`item`、`table`、`aspect-ratio`                    | 提供可理解的本地内容和必要尺寸。                      |
| 表单与选择 | `checkbox`、`switch`、`slider`、`select`、`combobox`、`input-otp`   | 标签、默认状态、禁用状态、输入或选择回调。            |
| 弹层与菜单 | `dialog`、`alert-dialog`、`drawer`、`dropdown-menu`、`context-menu` | 正确组合 Root、Trigger、Content，展示打开和关闭行为。 |
| 复合布局   | `sidebar`、`carousel`、`resizable`、`tabs`                          | 上下文、明确容器尺寸、折叠或切换方式。                |
| 数据与消息 | `chart`、`message`、`message-scroller`、`toast`、`questionnaire`    | 固定数据、局部状态、Provider 和可见操作结果。         |

新增组件后，仍需补上代表性的交互和边界状态。Story 的职责是把组件放在有效环境中，不应该重写组件本身的逻辑。示例中的菜单动作、删除确认和问卷提交只更新本地展示，不调用真实业务服务。

## 配置作用范围与扩展功能

### 全局、组件和 Story 配置

全局默认配置放在 `preview.tsx`，某个组件共用的配置放在 Meta，只有一个示例需要的配置放在该 Story。对于可覆盖的配置，通常是全局默认、组件配置、Story 配置逐层生效。

例如全局给颜色属性设置 matcher，Input 的 Meta 限定可编辑参数，而文件选择 Story 再限定为只编辑禁用状态和样式。`parameters` 会合并，不能假设局部写了一个字段就清空所有全局配置。`args` 中同名参数由更具体的示例值覆盖。

业务路由、请求、登录状态等演示环境可以通过组件级装饰器或专用演示组件提供。真实服务并非每个 Story 都必须连接；通常先用固定数据展示空状态、正常状态和错误状态。

### globals 与工具栏选择

`args` 是当前示例的组件参数，`globals` 是 Storybook 级别的共享选择。例如语言、设备或主题选择，可以通过 `preview.tsx` 中的 `globalTypes` 定义工具栏菜单，再通过 `initialGlobals` 设置初始值。

装饰器读取 `context.globals` 将选择应用到组件环境。定义一个 globals 不会自动调用 Provider，也不会自动改变组件 props，需要自己连接渲染逻辑。本项目的 Manager 主题目前是自定义工具与存储机制，不是 globals 实现。[工具栏与 globals](https://storybook.js.org/docs/essentials/toolbars-and-globals)

### 插件与可选能力

需要额外功能时，先确认当前版本的支持方式，再安装兼容版本的插件，在 `main.ts` 中注册，并按插件要求配置预览参数。本项目已注册 `@storybook/addon-vitest` 和 `@storybook/addon-a11y`：前者运行 Story 与 `play`，后者用 axe 检查无障碍问题。`preview.tsx` 中的 `parameters.a11y.test: 'error'` 使违规导致测试失败。启动 Storybook 后，可在 Accessibility 面板查看违规、通过和需要人工确认的检查；命令行沿用 `pnpm --filter @workspace/ui-base test:storybook`。[官方无障碍测试文档](https://storybook.js.org/docs/writing-tests/accessibility-testing)

添加插件不等于自动得到全部业务效果。例如背景选择主要改变展示背景，不能自动切换组件的 CSS 变量；Themes 插件也需要连接 CSS 类、属性或 Provider。多个主题入口同时修改 html 时容易互相覆盖，应明确由哪个入口负责。

### 当前测试能力与依赖分工

| 能力 | 当前状态 | 作用 |
| --- | --- | --- |
| 组件渲染与交互测试 | 已接入 | 在真实浏览器中渲染 Stories，执行 `play` 操作与断言。 |
| 无障碍自动检查 | 已接入 | 使用 axe 检查名称、ARIA、对比度等问题，配合人工键盘和读屏检查。 |
| 覆盖率报告 | 已接入 | 查看源码执行情况，发现遗漏的函数、分支和状态；暂不设置门槛。 |
| 视觉回归测试 | 暂缓 | 比较截图，发现布局、间距、颜色等外观变化。 |
| CI 自动测试 | 暂缓 | 在推送代码、创建 PR 等事件发生后自动运行检查。 |

现有测试依赖各司其职：

| 依赖或入口 | 职责 |
| --- | --- |
| `vitest` | 组织、执行测试并汇总结果。 |
| `@storybook/addon-vitest` | 将 Stories 接入 Vitest，并提供 Storybook 内的运行和结果入口。 |
| `@vitest/browser-playwright` | 连接 Vitest Browser Mode 与 Playwright。 |
| `playwright` 与配套 Chromium | 启动真实浏览器，提供组件运行环境；浏览器二进制单独下载。 |
| `storybook/test` | 提供 `expect`、`userEvent`、`within`、`fn` 等工具，是现有 `storybook` 包的子路径，无需另装同名包。 |
| `@storybook/addon-a11y` | 接入 axe 无障碍检查及 Accessibility 面板。 |
| `@vitest/coverage-v8` | 收集 Chromium 执行代码的覆盖率，版本与 Vitest 保持一致。 |

首次使用运行 `pnpm --filter @workspace/ui-base exec playwright install chromium`。项目中的 Playwright 版本决定配套浏览器版本；macOS 默认将浏览器存放在 `~/Library/Caches/ms-playwright/`，不放进项目或提交 Git，也不是安装 npm 依赖的位置。已有日常使用的 Google Chrome，不代表已安装这份测试浏览器。

### 侧栏测试菜单与灰色状态

在组件导航的三点菜单中，点击 **Run component tests** 右侧的 ▶，可以运行该组件下的 Stories。下面的 **Interactions** 和 **Accessibility** 是对应测试结果入口；当上方显示 **Not run**、右侧为灰点时，表示尚无结果可查看，入口暂时不可点击，并不表示功能未安装。

运行完成后查看成功或失败状态。项目级测试从侧栏底部的测试面板运行；Coverage 的开启方式见下文。底部 **Interactions** 面板用于查看当前 Story 的 `play` 步骤，底部 **Accessibility** 面板用于查看当前 Story 的扫描结果，它们与侧栏批量测试状态用途不同。命令行测试通过不会自动同步成当前 Storybook 侧栏中的运行结果。

### Accessibility 面板怎么看

Accessibility 插件使用 axe 自动检查当前 Story 渲染的 DOM。打开一个组件的 Story，在底部选择 **Accessibility** 查看结果；面板中的每一行是一条检查规则，不是需要手动执行的操作。

| 页签 | 含义 | 如何处理 |
| --- | --- | --- |
| **Violations** | 已确认的无障碍违规。 | 查看规则详情和涉及的元素，修复组件或示例，再重新扫描。 |
| **Passes** | 已通过的规则。 | 通常无需处理；例如 `Passes 12` 表示通过 12 条规则，不是执行了 12 个测试用例。 |
| **Inconclusive** | 工具无法确定结果，需要人工判断。部分文档称为 Incomplete。 | 根据详情检查相关元素和实际使用效果，不能直接当作通过或失败。 |

`Violations 0` 只表示本次扫描未发现明确违规，不代表组件完全无障碍。关闭的弹窗、尚未展开的选项等状态可能未被本次扫描覆盖；需要分别展示并检查这些状态。切换主题或操作组件后，应确认面板已重新扫描；若出现重新运行检查的按钮，可手动触发。

ARIA（Accessible Rich Internet Applications）通过 `role`、`aria-label`、`aria-expanded` 等属性，为辅助技术提供控件角色、名称和状态。例如一个只有图标的关闭按钮，可以用 `aria-label="关闭"` 提供名称。普通文本按钮应优先使用其可见文字，不必给所有元素都添加 ARIA。

常见规则的含义如下；右侧规则 ID 用于查阅说明和定位问题，不是组件属性名：

| 规则名称 | 规则 ID | 检查内容 |
| --- | --- | --- |
| Supported ARIA attributes | `aria-allowed-attr` | 元素角色是否支持所使用的 ARIA 属性。 |
| ARIA attribute valid for role | `aria-conditional-attr` | ARIA 属性是否满足当前角色和使用条件。 |
| Hidden body | `aria-hidden-body` | 是否错误地用 `aria-hidden="true"` 将整个页面主体对辅助技术隐藏。 |
| Hidden element focus | `aria-hidden-focus` | 对辅助技术隐藏的内容是否仍能获得键盘焦点。 |
| ARIA prohibited attributes | `aria-prohibited-attr` | 是否在不允许使用某个 ARIA 属性的元素上使用了它。 |
| ARIA attribute values valid | `aria-valid-attr-value` | 属性值是否合法，例如 `aria-expanded` 的状态值、引用的元素 ID。 |
| ARIA attribute valid | `aria-valid-attr` | 属性名是否有效，是否存在拼写错误。 |
| Forced inline spacing | `avoid-inline-spacing` | 是否通过在文字之间插入空格强行排版，影响读屏理解。 |
| Button name | `button-name` | 按钮是否有可被辅助技术识别的名称。 |
| Color contrast | `color-contrast` | 文字与背景之间的对比度是否达到检查要求。 |

例如 **Button name 通过**，只能说明按钮有可访问名称；名称是否准确表达“保存”或“删除”，还需要人工判断。**Color contrast 通过**也不能代替对焦点可见性、文字遮挡、错误提示是否易懂等问题的检查。

### 如何手动校验无障碍

建议先检查 Button 和 Dialog，再扩展到表单、菜单、选择器。尽量将单个 Story 在新标签页打开，减少 Storybook 导航和工具栏对键盘操作的干扰。

1. **只用键盘完成操作。** 用 `Tab`、`Shift + Tab` 移动焦点，检查顺序是否合理、焦点边框是否清晰。按钮应能通过 `Enter` 或空格触发，禁用按钮不能触发。菜单、Tabs、Select、Slider 等还需要按其交互模式检查方向键；不要求每个选项都成为独立的 Tab 停靠点。
2. **检查弹层焦点。** 以模态 Dialog 为例：打开后焦点应进入弹窗；Tab 应在弹窗内移动，不能进入背景控件；允许通过 Esc 关闭时，关闭后焦点应回到触发按钮。非模态 Popover 不一定需要限制焦点范围，应按组件的交互设计判断。
3. **使用读屏器。** Mac 可在“系统设置 → 辅助功能 → 旁白”开启 VoiceOver。逐个访问控件，确认能读出有意义的名称和角色，例如“保存，按钮”；输入框能读出用途，复选框和开关能读出选中状态，弹窗能读出标题。不要只确认“有声音”，还要确认播报能帮助用户理解并完成操作。
4. **检查放大与主题。** 将浏览器缩放到 200%，查看文字、标签、错误提示是否被截断，控件是否重叠或无法操作；切换明暗主题，检查文字、边框和焦点指示是否清晰。
5. **覆盖状态变化。** 分别检查正常、禁用、选中、展开、错误、空结果等适用状态。错误不能只靠红色表达，应有明确文案；输入标签应说明用途，不能仅依赖输入后就消失的 placeholder。

例如手动检查 Dialog 时，可以依次执行“Tab 到打开按钮 → Enter 打开 → 确认焦点进入弹窗 → 连续 Tab / Shift + Tab → Esc 关闭 → 确认焦点返回”。记录具体 Story、主题、操作步骤、期望与实际结果，便于复现。

发现可以稳定自动验证的问题后，将键盘操作、焦点返回、可访问名称等补充到 `play` 中。人工检查与自动检查互相补充：axe 主要发现结构、属性和部分视觉问题，交互断言验证操作结果，读屏与人工体验检查判断实际使用是否清晰、顺畅。当前 `test:storybook` 会在 Story 的交互完成后执行无障碍检查，并不会自动扫描交互过程中的每一个状态；重要的中间状态可以单独编写 Story。

参考：[Storybook 无障碍测试](https://storybook.js.org/docs/writing-tests/accessibility-testing)、[W3C 无障碍初步检查指南](https://www.w3.org/WAI/test-evaluate/easy-checks/)。

### 测试覆盖率：生成与查看

覆盖率记录测试运行时哪些源码被执行过，用来发现遗漏的分支和状态。本项目使用 `@vitest/coverage-v8`，版本与 Vitest 保持一致；现有 Playwright Chromium 支持 V8 覆盖率，无需额外接入 `@storybook/addon-coverage` 或编写一套新测试。

本包的 Storybook 相关依赖统一为 10.6.3，包含 Vitest 5 所需的覆盖率 reporter 默认导出修复；10.6.2 可能在测试通过后生成界面汇总时报错。

在仓库根目录执行：

```bash
pnpm --filter @workspace/ui-base test:storybook:coverage
```

该命令在现有交互与无障碍检查的基础上增加覆盖率收集。终端输出汇总，HTML 报告位于 `packages/ui-base/coverage/index.html`，机器可读汇总位于同目录的 `coverage-summary.json`。用浏览器打开 HTML，点击文件查看具体未覆盖的行或分支。报告目录已加入 `.gitignore`，重复运行时会更新；普通 `test:storybook` 不主动启用覆盖率。

在 Storybook 中查看报告：

1. 重启 Storybook，使新依赖和配置生效。
2. 展开侧栏底部的测试面板，关闭 watch（监听模式）。
3. 勾选 **Coverage**，点击运行全部组件测试。
4. 完成后点击覆盖率百分比，打开详细报告。

组件右侧三点菜单只运行选中的组件，不生成整个项目的覆盖率汇总；watch 模式也不提供该报告。若 Coverage 或报告入口不可用，先检查是否关闭 watch、勾选 Coverage，并完成了一次全量运行。Storybook 内运行的报告由插件保存在自身缓存中，命令行生成的 `coverage/` 不会自动成为侧栏测试结果。

报告常见指标如下：

| 指标 | 含义 | 如何使用 |
| --- | --- | --- |
| Statements（语句） | 被执行的语句占比。 | 找出从未运行的逻辑。Storybook 测试面板的汇总百分比使用此项。 |
| Branches（分支） | 条件分支被执行的占比，例如 if/else、三元表达式。 | 发现未覆盖的禁用、空值、错误、边界条件等路径。 |
| Functions（函数） | 被调用的函数占比。 | 检查回调、事件处理和辅助函数是否执行。 |
| Lines（行） | 被执行的源码行占比。 | 在逐文件报告中定位执行缺口。 |

统计配置集中在 `packages/ui-base/vitest.config.ts` 的根级 `test.coverage` 中。当前包含 `src/components`、`src/hooks`、`src/provider`、`src/lib` 下的 TS/TSX 源码，即使文件未被本轮测试导入，也在统计范围内；排除 Stories、测试文件、类型声明和纯导出的 `index.ts`，包含实现的 `index.tsx` 仍计入。演示应用入口、样式和 Storybook 配置不计入组件库覆盖率。

当前不设置强制覆盖率门槛。优先查看有实际行为的低覆盖分支，再补充对应 Story 或 `play`。例如分页首页、末页、修改每页条数、非法跳转值，分别对应不同路径。执行到代码不等于验证了结果：渲染 Story 就可能提高覆盖率，仍需要断言内容、状态、回调和焦点；100% 覆盖率也不能代替无障碍检查或证明没有缺陷。

目录标红表示覆盖率低，不表示该目录已有功能错误。例如 `hooks` 的汇总需要点进去查看具体文件，避免将某个未执行的 Hook 与其他已充分执行的 Hook 混为一谈。当前 Hook 与高亮工具测试包括：

| Story | 验证内容 |
| --- | --- |
| `hooks/useIsMobile` | 初始视口判断；真实调整预览 iframe 至 375、767、768、1024px，验证媒体查询变化和断点边界；卸载后重新挂载，读取当前视口。结束时恢复 iframe 宽度，单独打开预览页面时可手动缩放窗口。 |
| `hooks/useHighlightedCode` | 真实异步加载 Shiki；支持的语言、别名及大小写；多行流式追加与语法状态延续；重写、清空、切换语言、未知语言回退、末尾换行及 ANSI 颜色。检查原文保持、颜色节点和行数，避免只验证“有内容”。 |
| `lib/highlighter` | `highlightCode` 一次性多行高亮；未知语言返回 null 后由调用方显示原文；原文按文本显示，避免被当作 HTML 执行。 |

这些示例使用真实高亮器，不通过模拟 Hook 返回值来提高覆盖率。查看未覆盖行后，仍应判断其业务意义；例如异步失败、取消加载等路径不能仅凭正常高亮用例就宣称已验证。

参考：[Storybook 测试覆盖率](https://storybook.js.org/docs/writing-tests/test-coverage)、[Vitest 覆盖率](https://vitest.dev/guide/coverage.html)。

### 暂缓的视觉测试与 CI

视觉回归测试对比本次截图与已确认的基准截图，适合发现组件尺寸、字体、间距、颜色和布局的意外变化。Storybook 引导中的官方 Visual Tests addon（`@chromatic-com/storybook`）对接 Chromatic，需要账号并创建或关联项目；即使从本地 Storybook 点击运行，也会上传 Storybook 构建并在云端测试。纯本地截图对比可以使用 Vitest Browser Mode 与 Playwright，但本项目目前尚未接入这两种视觉测试流程。[Chromatic 官方说明](https://www.chromatic.com/docs/visual-tests-addon/)

CI（持续集成）把已有测试放到自动化运行环境中。以 GitHub Actions 为例，配置通常位于 `.github/workflows/*.yml`，可在推送代码或创建 PR 后安装依赖、安装 Chromium、运行检查并保存覆盖率报告，结果显示在仓库 Actions 或 PR Checks 中。PR（Pull Request，合并请求）是申请将一个分支的改动审核并合并到另一个分支，创建 PR 本身不会立即合并代码。当前只保留本地测试流程，尚未为 ui-base 配置此 CI。

### 静态资源与环境变量

组件旁的小资源可以通过源码 import 交给 Vite 处理。如果要直接通过 URL 访问资源目录，可在 `main.ts` 中配置 `staticDirs`，例如 `staticDirs: ['../public']`；路径相对于配置目录。

环境变量的读取方式要区分 `main.ts` 的启动环境与 Preview 的浏览器环境。浏览器可读取的环境变量最终会进入页面代码；需要接业务 API 时，分别确认开发地址、构建时注入值和部署环境，避免把本地地址固化到静态文档中。

## 文档开发与 Provider 示例

### Autodocs 自动文档

本项目启用了 Docs 插件，Meta 中增加 `tags: ['autodocs']` 后会生成 Docs 导航入口。文档内容来自组件信息、属性推断、描述、argTypes 和 Stories。

属性推断不能保证所有复杂类型都准确，枚举、说明、默认值可以用 `argTypes` 手动补充。文档中的默认值说明与实际 `args` 是不同字段，手写说明时应与组件实现保持一致。[Autodocs](https://storybook.js.org/docs/writing-docs/autodocs)

### MDX 编写说明页面

使用指南、安装说明、设计约定适合写成 MDX。当前扫描 `src/**/*.mdx`，已有 `src/docs/getting-started.mdx`，在导航中显示为 `guides/快速开始`，并用 `Canvas` 引用 Button 的默认和描边 Story。`docs/storybook.md` 是仓库开发文档，不会自动成为在线 Docs 页面。

该页面的最小结构如下：

```mdx
import {Meta} from '@storybook/addon-docs/blocks';

<Meta title="guides/GettingStarted" />

# 使用 ui-base

在消费应用中安装工作区依赖，并导入组件样式。
```

MDX 可以组合说明文字与 Docs Blocks；展示已有 Story 时，可以导入对应 stories 模块，再用 `Canvas` 等块引用它。普通 React 示例代码写在 Markdown 代码块里仅展示文本，不会自动成为可交互示例。[MDX 文档](https://storybook.js.org/docs/writing-docs/mdx)

### Provider 的特殊处理

ThemeProvider Story 位于 `provider/ThemeProvider`，展示 `theme`、`resolvedTheme` 和主题切换。Provider 操作 `html`，因此它有整个文档范围的副作用，不能假设只影响包裹的卡片。

当前 Provider Docs 设置 `story.inline: false`，让示例运行在独立 iframe 中；离开示例时还原之前的 `light/dark` 类和 `color-scheme`。示例使用专用存储键，避免覆盖应用默认的 `theme`。

非内联 Docs 示例的 Controls 更新能力可能受渲染方式限制，需要实际验证；需要稳定调参时可打开单独的 Canvas。自定义 `render` 不一定能生成最直观的使用代码，必要时用 `parameters.docs.source` 明确提供源码示例。

## 主题的实现与数据流

### Storybook 界面主题

当前菜单、工具栏、Controls 与 Docs 外壳共用 `storybook-manager-theme`，默认暗色。它们使用 Storybook 的 `themes.light/dark`，不使用组件库 ThemeProvider。

| theme 目录文件       | 职责                                                   |
| -------------------- | ------------------------------------------------------ |
| `manager-theme.ts`   | 调用 `addons.setConfig()` 应用 Manager 主题            |
| `theme-tool.tsx`     | 工具栏按钮，点击后应用并保存选择                       |
| `theme-state.ts`     | 读取、保存选择，提供 storage 订阅                      |
| `docs-container.tsx` | 用 `useSyncExternalStore` 订阅选择，传给 DocsContainer |
| `preview-theme.ts`   | 同步 iframe 内的加载背景变量                           |
| `loading.css`        | 覆盖 Storybook 加载遮罩和文档骨架的白色背景            |

```text
ThemeTool 点击
→ applyManagerTheme() 更新外层界面
→ saveManagerTheme() 写入 localStorage
→ 浏览器向同源 Preview iframe 发出 storage 事件
→ DocsContainer 更新文档主题
→ preview-theme 更新 iframe 加载背景
→ SyncManagerTheme 更新组件预览的 ThemeProvider
```

`storage` 不通知执行写入的那个页面，所以 Manager 在点击时直接更新，Docs 在另一页面里监听。存储不可用时，Manager 当前切换仍可工作，但保存与 Docs 同步不能保证。

共享状态模块不导入 `storybook/manager-api`，避免把只属于 Manager 的依赖带到 Preview 环境。Manager 工具使用 `React.createElement`，保证渲染时显式使用已导入的 React，避免 Manager JSX 编译环境中的缺失引用问题。

### 组件预览主题

`PreviewUiBase` 提供组件库的 ThemeProvider，存储键为 `storybook-preview-theme`。组件颜色来自 `src/styles/index.css` 的亮色变量和 `.dark` 变量。

预览首次挂载时以 Manager 的当前选择为准，覆盖旧的预览主题缓存。`SyncManagerTheme` 使用 `useSyncExternalStore` 订阅 Manager 存储变化，再通过 `useTheme().setTheme()` 同步到预览 Provider。仅设置 `defaultTheme` 不够，因为 Provider 会优先读取已有存储值。

预览中的 ThemeSwitch 继续保留，可以临时独立切换组件主题，不会反向修改 Manager。Manager 下次切换时，预览会重新跟随；刷新或重新挂载预览时也重新以 Manager 为准。同步组件用 ref 记录上次已同步的 Manager 主题，避免 Provider 重新渲染时覆盖用户的临时选择。

官方 `@storybook/addon-themes` 可提供组件预览主题选择，本项目当前没有安装它。它不等同于 Manager 自定义组件插槽，也不会自动完成这里的 Manager 与 Docs 同步。[Themes 插件](https://storybook.js.org/docs/essentials/themes)

### 加载背景与独立 iframe 的首屏

刷新时外层 Manager 的加载区域由 `appPreviewBg` 控制。Storybook 内置暗色主题的该值仍可能为白色，因此本项目显式覆盖。

切换 Canvas 与 Docs 时，iframe 内还有 `.sb-preparing-story`、`.sb-preparing-docs` 加载遮罩，其默认背景固定为白色。`loading.css` 使用专门的 `--storybook-loading-*` 变量覆盖，只作用于加载状态，不改变组件主题。

Docs 中设置了 `inline: false` 的示例会创建独立 iframe。它的空白页面、基础 CSS 和 React 初始化并不同步，仅在 `preview.tsx` 中切换主题会来不及阻止首次白底。`.storybook/preview-head.html` 在 React 和预览模块执行前，通过同步脚本读取 Manager 主题，设置 `html` 的主题类、`color-scheme` 和加载颜色变量，并提供 `html/body` 与加载遮罩的初始背景。

预览样式加载后，背景使用组件的 `--background` 变量，因此 ThemeSwitch 仍可临时独立切换。后续 Manager 变化仍由现有订阅机制处理。head 中的存储键和默认暗色需与 `theme-state.ts` 保持一致。修改 `preview-head.html` 后重启 Storybook，以确保新建的 iframe 使用最新页面模板。

如果移动主题初始化代码，要确保它被实际调用。本包的 `sideEffects` 声明会影响构建优化，所以使用 `setupPreviewLoadingTheme()` 显式初始化，而不是只导入一个无人调用的脚本。订阅在热更新时通过 `import.meta.hot.dispose()` 清理。

## 常用命令与发布

### 工作区根目录执行

```bash
pnpm --filter @workspace/ui-base storybook
pnpm --filter @workspace/ui-base typecheck
pnpm --filter @workspace/ui-base lint
pnpm --filter @workspace/ui-base build-storybook
# 首次准备测试浏览器。
pnpm --filter @workspace/ui-base exec playwright install chromium
# 单次测试、监听模式、覆盖率报告。
pnpm --filter @workspace/ui-base test:storybook
pnpm --filter @workspace/ui-base test:storybook:watch
pnpm --filter @workspace/ui-base test:storybook:coverage
```

在 `packages/ui-base` 中可直接使用 `pnpm storybook`、`pnpm typecheck`、`pnpm lint`、`pnpm build-storybook`。

新增 Manager 入口、插件或修改启动参数后，应重启服务。一般的组件和 Story 编辑可以热更新，但遇到未生效的配置时仍需确认是否需要重启。

### 静态构建与托管

`build-storybook` 默认输出 `storybook-static/`，其中包含 HTML、JS、CSS、字体和 Story 索引，可部署到静态网站托管服务。构建输出不用提交到 Git，部署流程上传产物即可。

本地查看静态产物时需要用 HTTP 服务提供目录，不宜直接以 `file://` 打开。部署后测试资源加载、导航深链、Docs 和主题切换；静态托管地址下的 localStorage 与开发地址分别保存。

Vercel 的项目配置与部署步骤见 [ui-base 部署指南](../packages/ui-base/vercel-deploy.md)。

## 常见问题与排查顺序

| 现象                              | 优先检查                                                                         |
| --------------------------------- | -------------------------------------------------------------------------------- |
| 新 Story 没出现在导航             | 文件名、`main.ts` 扫描范围、默认 Meta 导出和 Story 命名导出、终端报错            |
| Docs 没生成                       | Docs 插件、`autodocs` 标签、是否有冲突的文档配置                                 |
| `args` 修改后组件没变化           | 自定义 `render` 是否传递 args，是否是受控参数或只挂载时生效的 defaultValue       |
| 组件没有样式                      | 预览 CSS 是否导入，移动后的路径、Vite Tailwind 插件和 @source 扫描范围           |
| `@ui-base` 或 CSS 导入报类型错误  | Storybook TS 配置、根 references、paths 和 `vite/client`；必要时重启 TS Server   |
| Manager 报 `React is not defined` | 自定义工具的 JSX 编译与 React 导入；本项目使用显式 createElement                 |
| 选择暗色但组件仍亮色              | 当前操作的是 Manager/Docs 还是组件预览；检查 iframe 的 html 类及 Provider 存储值 |
| 暗色下出现白色 loading            | 区分 Manager 的 appPreviewBg 与 iframe 的加载遮罩，确认初始化和样式都已打包      |
| Provider 示例影响其他 Story       | 检查全局 html 修改、独立 iframe 和卸载后的副作用还原                             |
| Controls 标签名不垂直居中         | 这是内置表格样式，当前没有对齐参数；覆盖 CSS 时分别考虑 Manager 和 Docs          |
| 启动端口没按预期变化              | 当前使用 start.mjs 还是直接 CLI、端口占用、是否传入附加参数                      |
| 构建提示找不到 MDX                | 当前扫描允许 MDX 但还未创建文件时会提示；与编译失败区分处理                      |

先查看终端和浏览器 Console 的具体错误，再定位 Manager 或 Preview。不要仅凭“Something went wrong”的通用提示就清空所有浏览器存储；存储键会影响保存的主题选择，但不是所有错误的来源。

## 维护约定

UI 组件使用 `components/名称` 分类，Provider 使用 `provider/名称`，Hook 使用 `hooks/名称`（例如 `hooks/useIsMobile`）；Story 放在实现旁，生产入口不导出 Story。演示需要的容器、参数与说明留在 stories 中，共用环境放在装饰器中。

保持界面主题与组件主题的职责清楚，修改组件时同时维护重要状态和文档说明。只改文档通常不需要重新构建组件库；改配置或 Story 时根据范围做类型、Lint、构建及浏览器检查。
