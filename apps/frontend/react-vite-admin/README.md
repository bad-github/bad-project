## vite

### env

以 VITE_ 为前缀的变量在 Vite 打包后会暴露在客户端源代码中，在 import.meta.env 对象下作为字符串

- .env：所有情况下都会加载
- .env.local：所有情况下都会加载，但会被 git 忽略
- .env.[mode]：只在指定模式下加载
- .env.[mode].local：只在指定模式下加载，但会被 git 忽略

开发服务器 (`dev` 命令) 运行在 `development`  模式，而 `build` 命令则运行在 `production` 模式。意味着当执行 `vite build` 时，它会自动加载 `.env.production` 中可能存在的环境变量

需要注意的是，`NODE_ENV`（`process.env.NODE_ENV`）和模式是两个不同的概念。以下是不同命令如何影响 `NODE_ENV` 和模式：

| Command                                              | NODE_ENV        | Mode            |
| :--------------------------------------------------- | :-------------- | :-------------- |
| `vite build`                                         | `"production"`  | `"production"`  |
| `vite build --mode development`                      | `"production"`  | `"development"` |
| `NODE_ENV=development vite build`                    | `"development"` | `"production"`  |
| `NODE_ENV=development vite build --mode development` | `"development"` | `"development"` |

## tailwind css

### 主题变量命名空间

通过在不同的命名空间下，添加主题变量，可以启动对应的工具类或变体

```css
@theme {
  --color-a: red;
}
```

如不同命名空间生成的变体

| Namespace          | Utility classes                                              |
| ------------------ | ------------------------------------------------------------ |
| `--color-*`        | Color utilities like `bg-red-500`, `text-sky-300`, and many more |
| `--font-*`         | Font family utilities like `font-sans`                       |
| `--text-*`         | Font size utilities like `text-xl`                           |
| `--font-weight-*`  | Font weight utilities like `font-bold`                       |
| `--tracking-*`     | Letter spacing utilities like `tracking-wide`                |
| `--leading-*`      | Line height utilities like `leading-tight`                   |
| `--breakpoint-*`   | Responsive breakpoint variants like `sm:*`                   |
| `--container-*`    | Container query variants like `@sm:*` and size utilities like `max-w-md` |
| `--spacing-*`      | Spacing and sizing utilities like `px-4`, `max-h-16`, and many more |
| `--radius-*`       | Border radius utilities like `rounded-sm`                    |
| `--shadow-*`       | Box shadow utilities like `shadow-md`                        |
| `--inset-shadow-*` | Inset box shadow utilities like `inset-shadow-xs`            |
| `--drop-shadow-*`  | Drop shadow filter utilities like `drop-shadow-md`           |
| `--blur-*`         | Blur filter utilities like `blur-md`                         |
| `--perspective-*`  | Perspective utilities like `perspective-near`                |
| `--aspect-*`       | Aspect ratio utilities like `aspect-video`                   |
| `--ease-*`         | Transition timing function utilities like `ease-out`         |
| `--animate-*`      | Animation utilities like `animate-spin`                      |

### cssVariables

cssVariables: true

```css
/* global.css */
@layer base {
  :root {
    --background: #ffffff;
    --foreground: #000000;
    --font-size: 16px; /* 默认字体大小 */
    --font-weight: 400; /* 默认字体粗细 */
    --opacity: 1; /* 默认透明度 */
  }

  .dark {
    --background: #0a0a0a;
    --foreground: #ffffff;
    --font-size: 18px; /* 暗色模式字体大小 */
    --font-weight: 500; /* 暗色模式字体粗细 */
    --opacity: 0.9; /* 暗色模式透明度 */
  }
}

/* 使用变量 */
.bg-background {
  background-color: var(--background);
}

.text-foreground {
  color: var(--foreground);
}

.font-size {
  font-size: var(--font-size);
}

.font-weight {
  font-weight: var(--font-weight);
}

.opacity {
  opacity: var(--opacity);
}
```

```html
<div className="bg-background text-foreground font-size font-weight opacity">内容</div>
```

cssVariables: false

```ts
import type {Config} from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'background-light': '#ffffff',
        'background-dark': '#0a0a0a',
        'foreground-light': '#000000',
        'foreground-dark': '#ffffff',
        'font-size-light': '16px',
        'font-size-dark': '18px',
        'font-weight-light': '400',
        'font-weight-dark': '500',
        'opacity-light': '1',
        'opacity-dark': '0.9',
      },
    },
  },
  plugins: [],
};

export default config;
```

```css
/* global.css */

@layer base {
  /* 默认的亮色模式 */
  .bg-background {
    background-color: theme('colors.background-light');
  }

  .text-foreground {
    color: theme('colors.foreground-light');
  }

  .font-size {
    font-size: theme('font-size-light');
  }

  .font-weight {
    font-weight: theme('font-weight-light');
  }

  .opacity {
    opacity: theme('opacity-light');
  }

  /* 暗色模式样式 */
  .dark .bg-background {
    background-color: theme('colors.background-dark');
  }

  .dark .text-foreground {
    color: theme('colors.foreground-dark');
  }

  .dark .font-size {
    font-size: theme('font-size-dark');
  }

  .dark .font-weight {
    font-weight: theme('font-weight-dark');
  }

  .dark .opacity {
    opacity: theme('opacity-dark');
  }
}
```

```html
<div className="bg-background text-foreground font-size font-weight opacity">内容</div>
```

### components.json

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  // 使用哪种组件设计风格
  "style": "new-york",
  // 是否为 React Server Components 模式
  "rsc": false,
  "tsx": true,
  "tailwind": {
    // 	指定 tailwind.config.ts 文件路径，留空表示默认位置（根目录）。对于 Tailwind CSS v4，请将此字段留空
    "config": "",
    // 指定哪一个 CSS 文件中包含了 @tailwind base/components/utilities，shadcn 会自动向这个文件注入样式
    "css": "src/global.css",
    //  每种color有不同的css变量：stone、zinc、gray、slate、scaled
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  // 添加的shadcn组件
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  // 指定默认图标库为 lucide-react
  "iconLibrary": "lucide"
}
```

baseColor：并不是控制 primary 颜色的，它控制的是灰色基准色，这个字段主要用于 Tailwind 的 gray-_、zinc-_、slate-\* 等颜色的替换，用来定义你整个设计系统的“灰色调性”。

| **配置值** | 含义           | **对应 Tailwind 色系**    |
| ---------- | -------------- | ------------------------- |
| gray       | 中性色，常规灰 | gray-100 ~ gray-900       |
| neutral    | 更接近中性灰   | neutral-100 ~ neutral-900 |
| slate      | 冷灰色，偏蓝   | slate-100 ~ slate-900     |
| stone      | 带土色调的灰色 | stone-100 ~ stone-900     |
| zinc       | 稍暖的灰色     | zinc-100 ~ zinc-900       |

### 样式写法

给父元素下所有的一级子元素设置样式

```
[&>*]:flex-shrink-0
```

非第一个子元素设置 mt-6

```
[&:not(:first-child)]:mt-6
```

当前元素的所有 svg 子元素：下划线转义空格

```
[&_svg]
```

```
<p before="Hello World" class="before:content-[attr(before)] ...">
  P
</p>
```

```
<div data-active class="border border-gray-300 data-active:border-purple-500">
  <!-- ... -->
</div>
<div data-size="large" class="data-[size=large]:p-8">
  <!-- ... -->
</div>
```

```
 <Progress
    className={cn('absolute bottom-0 left-0 h-1 bg-transparent', {
      '[&_[data-slot="progress-indicator"]]:bg-green-400': true
    })}
    value={totalPercent.pause}
  />
```

## 国际化

### 中英文样式

| **维度**         | **中文习惯**                   | **英文习惯**                     | **样式注意点 / 建议**                                        |
| ---------------- | ------------------------------ | -------------------------------- | ------------------------------------------------------------ |
| **换行行为**     | 每个汉字自动换行               | 单词整体换行，不会中间断开       | 使用 break-words / overflow-wrap: break-word 避免单词撑破容器 |
| **文本长度**     | 表达精简                       | 相同内容更长，可能超出           | 避免定宽，使用 min-width 或 max-w + truncate 兜底            |
| **对齐方式**     | 居中居多                       | 左对齐常见，易读性更高           | 文本类内容推荐加 .text-left（英文）或动态切换对齐方向        |
| **标点符号**     | 全角：，。！？                 | 半角：,.!?                       | 混合语言时注意空格及符号格式，如 Please 点击按钮             |
| **大小写**       | 无大小写                       | 大小写区分，标题多用首字母大写   | 注意 text-transform: capitalize 控制样式，避免错误全大写     |
| **字体选择**     | 优先宋体、微软雅黑、思源黑体等 | 优先 Roboto、Inter、Helvetica 等 | 可按语言动态切换字体（如 Tailwind 的 font-sans + CSS var）   |
| **文本溢出处理** | 较少发生                       | 常见单词较长造成溢出             | 加 .truncate / .text-ellipsis，并配合 title 属性兜底         |
| **排版布局**     | 汉字宽度统一，易排版           | 单词长度不一，换行不可控         | 留出额外空间，避免文字换行影响布局错乱                       |
| **按钮文字**     | 短如“保存”                     | 长如“Save changes”               | 按钮用 px 替代 w-xx 固定宽度，避免文字被截断                 |
| **菜单项文字**   | 多为两三个字                   | 多为 1~3 个词                    | 使用 min-w, 避免固定宽度造成截断                             |

## 请求

### axios

本地代理

```ts
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    rewrite: path => path.replace(/^\/api/, '')
  }
}
```

| baseURL | request 参数    | 最终请求地址（本地）                  | 最终请求地址（线上） | 原因说明                                            |
| ------- | --------------- | ------------------------------------- | -------------------- | --------------------------------------------------- |
| `/api`  | `users/getAll`  | `/api/users/getAll` => `users/getAll` | `/api/users/getAll`  | 相对路径，正常拼接                                  |
| `/api`  | `/users/getAll` | `/users/getAll` => 无法匹配           | `/users/getAll`      | url 以 `/` 开头，**会覆盖 baseURL**（axios 的行为） |
| `/api/` | `users/getAll`  | `/api/users/getAll` => `users/getAll` | `/api/users/getAll`  | 最推荐写法，路径拼接安全                            |
| `/api/` | `/users/getAll` | `/users/getAll` => 无法匹配           | `/users/getAll`      | url 以 `/` 开头，**会覆盖 baseURL**                 |

### fetch

本地代理

```ts
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    rewrite: path => path.replace(/^\/api/, '')
  }
}
```

| baseURL | url 参数        | 最终请求地址（本地）                    | 最终请求地址（线上） | 原因说明 |
| ------- | --------------- | --------------------------------------- | -------------------- | -------- |
| `/api`  | `users/getAll`  | `/apiusers/getAll` => 无法匹配          | `/apiusers/getAll`   | 错误     |
| `/api`  | `/users/getAll` | `/api//users/getAll` => `/users/getAll` | `/api/users/getAll`  | 正确     |
| `/api/` | `users/getAll`  | `/api/users/getAll` => `users/getAll`   | `/api/users/getAll`  | 推荐写法 |
| `/api/` | `/users/getAll` | `/api//users/getAll `=> `/users/getAll` | `/api//users/getAll` | 支持     |

## Prettier

安装包

- prettier
- eslint-config-prettier：**禁用**所有 ESLint 中与 Prettier 冲突的格式化规则

创建文件

- `.prettierrc`
- `.prettierignore`

配置命令

- `"prettier": "prettier --check ."`、` "prettier": "prettier --check src"`
- `"prettier:fix": "prettier --write ."`、`"prettier:fix": "prettier --write src"`

## indexed db

### 主键

`{records: "id"}`

不自增，插入时必须手动传递id

### 自增主键

{records: "++id"}

自动递增，插入时不用传递id

### 普通索引

`{records: "++id, email"}`

email 能重复

```typescript
await db.records.add({email: 'a@test.com'});
await db.records.add({email: 'a@test.com'}); // ✅ 可以
```

### 唯一索引

`{records: "++id, &email"}`

email 不能重复

```typescript
await db.users.add({email: 'a@xx.com'});
await db.users.add({email: 'a@xx.com'}); // ❌ 报错
```

### 多值索引

`{records: "++id, *tags"}`

- `tags` 是数组
- 每个元素都会被索引

```typescript
await db.articles.add({
  title: 'Dexie Guide',
  tags: ['js', 'db', 'frontend'],
});
db.articles.where('tags').equals('js');
```

### 复合索引

`{records: "++id, [userId+status]"}`

```typescript
await db.orders.where('[userId+status]').equals([1, 'done']).toArray();
```

### 唯一复合索引

`{records: "++id, &[userId+productId]"}`

```typescript
await db.orders.add({
  userId: 1,
  productId: 2,
});

await db.orders.add({
  userId: 1,
  productId: 2,
}); // ❌ 报错
```

## 乾坤

作为乾坤的子应用集成方式

### 入口

`main.tsx`

```tsx
import {qiankunWindow} from 'vite-plugin-qiankun/dist/helper';
import {initQianKun, render} from './qian-kun.tsx';

const checkMicro = () => {
  const isInMicro = qiankunWindow.__POWERED_BY_QIANKUN__ === true;
  console.warn('isInMicro', isInMicro);
  return isInMicro;
};

initQianKun();
if (!checkMicro()) {
  render({});
}

```

`qian-kun.tsx`

```tsx
import {createRoot, Root} from 'react-dom/client';
import {renderWithQiankun} from 'vite-plugin-qiankun/dist/helper';
import App from './App';
import useGlobalStore from './store/global-store';
import {changeTheme, getCurTheme} from './provider/preference-provider';

let root: Root | null = null;

function innerStyle(props: any) {
  if (!import.meta.env.DEV) return;
  const {container} = props;
  if (!container) return;
  const header = container.querySelector('qiankun-head');
  if (!header) return;
  const viteStyles = document.querySelectorAll('head > style[data-vite-dev-id]');
  viteStyles.forEach((style) => {
    const devId = style.getAttribute('data-vite-dev-id') || '';
    // 只处理属于该子应用的样式
    if (devId.includes('react-vite-shadcn')) {
      // if (style.innerHTML.includes('body')) {
      //   style.innerHTML = style.innerHTML.replace(/body(?=[\s{,])/g, ':host');
      // }
      header?.appendChild(style);
    }
  });
}

export const render = (props: any) => {
  const {container} = props;
  if (container?.host) {
    // 设置shadow root的主题
    const theme = getCurTheme();
    changeTheme(container.host, theme);
    useGlobalStore.getState().setGlobal({shadowHost: container.host});
  }
  // 优先从 props 中找容器，找不到再回退到 document（独立运行）
  const targetContainer = container ? container.querySelector('#g-root') : document.getElementById('g-root');

  if (targetContainer) {
    root = createRoot(targetContainer);
    root.render(<App isInMicro={!!container} />);
  }
};

export const initQianKun = () => {
  let offGlobalStateChange: () => void;
  const {setGlobal, reset} = useGlobalStore.getState();
  renderWithQiankun({
    // 当前应用在主应用中的生命周期
    // 文档 https://qiankun.umijs.org/zh/guide/getting-started#
    bootstrap() {
      // console.warn('react-vite-shadcn bootstrap');
    },
    mount(props) {
      // 作为子应用的样式问题还未解决
      console.warn('react-vite-shadcn mount', props);
      props.setLoading?.(false);
      setGlobal({...(props.globalState || {}), isInMicro: true});
      innerStyle(props);
      render(props);
      offGlobalStateChange = props.onGlobalStateChange((state: any) => {
        console.warn('react-vite-shadcn onGlobalStateChange', state);
        setGlobal({...(state || {}), isInMicro: true});
      });
    },
    update(props) {
      console.warn('react-vite-shadcn update');
      setGlobal({...(props.globalState || {})});
    },
    unmount() {
      // console.warn('react-vite-shadcn unmount');
      offGlobalStateChange?.();
      reset();
      root?.unmount();
      root = null;
    },
  });
};

```

### `router`

- 作为子应用时：路由需要配置主应用给的 `basename`
- 独立部署时，则只需自定义 `basename`

值是主应用的路径地址，比如

`http://www.cat.com/projects/qian-kun`：其中 `/qian-kun` 是子应用的路由资源，`projects` 是主应用的路由资源

### `vite.config.ts`

```ts
import {defineConfig, loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import qiankun from 'vite-plugin-qiankun';

// https://vite.dev/config/
export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd());
  const isDev = mode === 'development';
  return {
    plugins: [
       // VITE_APP_NAME要和主应用注册微应用的name保持一致
      qiankun(env.VITE_APP_NAME, {
        useDevMode: isDev,
      }),
      react(), // 子应用本地集成测试时注释
    ],
  };
});
```

### 样式

若主应用开启了严格样式隔离，则子应用会被挂载到 `shadow root` 中，而 `shadow root` 中没有 `html、body` 标签，但 `:host` 标签可以定位到 `shadow root` 的 `host` 属性，所以在定义主题变量时如下

```css
html,
:host {
  --g-border-color-1: rgb(229, 230, 235);
}

html:is(.dark),
:host(:is(.dark)) {
  --g-border-color-1: rgb(72, 72, 73);
}

```

在切换主题时也要同步修改 `shadow root` 的 `class`

## 场景

| 类别     | 示例                                       |
| -------- | ------------------------------------------ |
| 拖拽组件 | `dnd-kit`、`Sortable.js`、`拖拽上传`、排序 |
| 拖拽布局 | 页面搭建器、低代码平台                     |
| 画布类   | 流程图、图编辑器（如 antv/x6）             |
| 滑块验证 | 登录验证、图形验证                         |
| 文件上传 | 分片上传、大文件处理、进度条               |

| 类别       | 示例                                        |
| ---------- | ------------------------------------------- |
| 权限控制   | 页面权限、按钮权限、路由守卫                |
| 国际化     | 多语言 i18n                                 |
| 主题切换   | 暗黑模式、动态主题色                        |
| 响应式布局 | Media Query、Grid Layout                    |
| 状态管理   | `Redux`、`Zustand`、`Pinia`、`Recoil`       |
| 本地缓存   | `localStorage`、`sessionStorage`、IndexedDB |

| 类别      | 示例                            |
| --------- | ------------------------------- |
| 图表      | 饼图、折线图、柱状图            |
| 地图      | 地理信息可视化（如 L7、Mapbox） |
| 拓扑图    | 节点+连线，适用于流程图、关系图 |
| 3D 可视化 | `Three.js`、WebGL、SVG 动画     |

| 类别                   | 示例                          |
| ---------------------- | ----------------------------- |
| Markdown 编辑器        | 富文本（如 `Slate`、`Quill`） |
| JSON Schema 表单生成器 | 可配置表单                    |
| 文件预览               | Office/pdf/image preview      |
| 富交互图层             | 拖动缩放图层（地图、图像）    |
| 工作流/流程图引擎      | 流程驱动的界面                |


## 指标统计

目前确认的实现目标：
1. 统计对象仅为 react-vite-admin。
2. 依赖安装时间：
   - 不主动清理缓存。
   - 记录安装前的缓存状态和实际安装方式。
   - monorepo 中统计项目及其 workspace 依赖。
   - 使用现有 lockfile，避免统计过程修改它。
3. 开发服务器启动时间：
   - 从启动进程开始，到 Vite 输出 ready 为止。
   - 暂不统计 React 页面可用时间。
4. 生产构建时间分别记录：
   - tsc -b
   - vite build
   - 两者端到端总时间
5. 构建产物统计：
   - 原始大小
   - gzip 大小
   - Brotli 大小
   - 各文件大小
   - 最大 JS/CSS chunk
   - 排除 sourcemap、分析报告和 .DS_Store
6. 运行环境记录：
   - Node、pnpm、Vite、TypeScript
   - OS、CPU、架构、内存
   - Git commit、工作区状态
   - CI 环境、lockfile 信息
   - 不额外固定工具版本
7. 采样规则：
   - 启动和构建支持自定义预热次数与正式采样次数。
   - 输出每次采样、最小值、最大值、平均值和中位数。
   - 只有正式样本至少 20 次时才计算 P95，否则明确标记未计算。
   - 安装只执行一次。
8. 输出形式：
   - 终端摘要
   - JSON 完整报告
   - 报告不提交 Git
   - 只报告，不设置 CI 失败门禁
9. 代码应放在 react-vite-admin 项目内部，便于以后整体迁移。
暂不实现：
- HMR 更新时间
- 页面可用时间
- 首屏实际加载量
- 性能阈值和 CI 阻断规则

todo：
- tab切换时保存组件状态
- tiptap 内部切换主题时
- rhf useController
- 权限系统



https://react-vite-admin-sigma.vercel.app



