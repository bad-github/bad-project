# i18n

## 使用方式

ESM/CJS 产物通过文件后缀明确模块格式，UMD 使用浏览器脚本常用的 `.js`：ESM 为 `dist/esm/index.mjs`，CJS 为 `dist/cjs/index.cjs`，UMD 为 `dist/umd/index.js`。`exports` 分别为 `import` 和 `require` 指定入口；`unpkg`、`jsdelivr` 指向 UMD 产物，不再生成目录级 `package.json`。

每个应用通过 `createI18n` 创建自己的实例。初始化完成后，翻译、添加语言资源等操作都使用该实例。

```ts
import {createI18n, getLngText} from '@workspace/i18n';
import {localeLoaders} from '@workspace/i18n/locales';

const {i18n, ready} = createI18n({loaders: localeLoaders, lng: 'zh', fallbackLng: 'zh'});
await ready;

const text = getLngText(i18n, 'notify.viewAll');
```

`getLngText` 的第一个参数必须传入实例：原来的 `getLngText(key, values)` 改为 `getLngText(i18n, key, values)`。插值参数仍通过第三个参数传入；切换语言后，后续调用使用该实例的当前语言。

初始化及按需加载时会复制语言资源，修改某个实例不会影响其他实例或原始资源。React 应用应通过 Provider 指定自己的实例，避免多个应用使用 `react-i18next` 的全局默认实例：

```tsx
import {I18nextProvider} from 'react-i18next';

<I18nextProvider i18n={i18n}>
  <App />
</I18nextProvider>;
```

`CreateI18nOptions` 支持 i18next 的初始化选项，例如 `supportedLngs`、`ns`、`defaultNS`。资源限定为可序列化的数据树；公共类型集中在 `src/types.ts`，从包入口导入。`SupportedLang` 为内置语言 `'en' | 'zh'`，自定义资源仍可使用其他语言。

### 按语言加载

核心入口 `@workspace/i18n` 不静态导入语言资源。`@workspace/i18n/locales` 只导出 `localeLoaders`，其中的动态导入在需要对应语言时才执行。原来的 `createI18n()` 改为显式传入 `loaders` 或 `resources`，仓库调用方已同步迁移。

默认只加载 `translation` 命名空间；初次加载当前语言和 `fallbackLng`，不会提前加载其他语言。初始化默认从注册的语言推导 `supportedLngs`，也可以显式配置。请为需要使用的当前语言、回退语言和命名空间提供加载器或预置资源。

```ts
const {i18n, ready} = createI18n({loaders: localeLoaders, lng: 'zh', fallbackLng: 'zh'});
await ready; // 目前只加载中文。
i18n.t('notify.viewAll'); // '查看所有'，原有翻译键不变。
await i18n.changeLanguage('en'); // 加载英文，复用已加载的中文回退资源。
await i18n.changeLanguage('zh'); // 复用中文资源。
```

新增语言时，在 `src/locales/` 添加语言目录，并在 `src/locales/index.ts` 注册它的加载器。语言切换菜单的标签由应用维护。新增语言需保持翻译键及插值参数一致。

### 按命名空间加载

`translation` 中的 `notify` 当前是文案分组，`notify.viewAll` 是嵌套键。大型业务模块可以独立注册为命名空间，例如 `order`；默认初始化不会加载它：

```ts
import type {LocaleLoaders} from '@workspace/i18n';
import {localeLoaders} from '@workspace/i18n/locales';

// 以下两个 order.ts 是应用自己维护的业务语言包，默认导出文案对象。
const loaders = {
  zh: {...localeLoaders.zh, order: () => import('./locales/zh/order').then((m) => m.default)},
  en: {...localeLoaders.en, order: () => import('./locales/en/order').then((m) => m.default)},
} satisfies LocaleLoaders;

const {i18n, ready} = createI18n({loaders, lng: 'zh', fallbackLng: 'zh'});
await ready;
await i18n.loadNamespaces('order');
i18n.t('order:title'); // order 为命名空间，title 是其中的键。
await i18n.changeLanguage('en'); // 自动加载英文中已启用的 translation、order。
```

React 页面也可通过 `useTranslation('order')` 触发加载。使用这种方式时应为页面配置 `Suspense` 加载占位，或设置 `useSuspense: false` 并检查返回的 `ready`。管理端的全局语言包则在入口等待初始化 `ready` 后才渲染，避免显示翻译键。

### 缓存、失败与重试

backend 和资源存储均按实例创建。同一实例下，i18next 合并同一语言、命名空间的并发加载，加载成功后直接使用资源缓存；不同实例不会共享可变文案，即使 `import()` 返回相同的模块对象。

首次初始化失败会使本包返回的 `ready` 拒绝。**i18next 原生的 `changeLanguage`、`loadNamespaces` 返回的 Promise 在资源加载失败时仍可能完成**，请通过回调检查错误，或监听 `failedLoading`。默认 `maxRetries: 0`，不会后台自动重试；加载器失败后，下次显式调用可再次加载。需要自动重试时可配置 `maxRetries`、`retryTimeout`。缺失的加载器属于注册错误，应补齐映射。

```ts
try {
  await ready;
} catch (error) {
  console.error('初始化失败，请重试或刷新', error);
}

await i18n.changeLanguage('en', (error) => {
  if (error) console.error('切换失败，再次调用 changeLanguage 可重试', error);
});
await i18n.loadNamespaces('order', (error) => {
  if (error) console.error('加载失败，再次调用 loadNamespaces 可重试', error);
});
```

加载失败时 i18next 仍可能切换到目标语言并使用回退文案；应用应显示错误提示，语言偏好只保存实际加载成功的语言。管理端已处理此情况。

### 全量资源与首屏资源混用

主动选择全量资源时，从独立入口导入，避免影响按需加载应用：

```ts
import {resources} from '@workspace/i18n/resources';
const {i18n, ready} = createI18n({resources, lng: 'zh'});
await ready;
```

也可以同时传入少量 `resources` 与 `loaders`，例如预置中文 `translation`，其余语言或业务命名空间通过加载器读取。已有资源不会重复加载。原来从根入口导入的 `resources` 需迁移到 `@workspace/i18n/resources`。

### 类型提示

`SupportedLang` 从内置加载器映射推导。`TranslationResource` 是基准语言的类型，使用 `import type` 不会加载中文文案。应用如需启用 i18next 的键名补全，可在自身的 `i18next.d.ts` 中声明：

```ts
import 'i18next';
import type {TranslationResource} from '@workspace/i18n';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {translation: TranslationResource};
  }
}
```

独立命名空间需同步添加到该类型声明中。公共库保留对自定义资源的支持，类型扩展由各应用维护。

### 手动添加和加载

已有的 `addLocale`、`loadLocale` 等方法继续支持直接操作指定实例；正常的自动加载流程使用 backend 即可。

加载器返回资源数据，不直接返回模块对象。默认导出和具名导出分别显式提取：

```ts
await loadLocale(i18n, 'en', 'user', () => import('./locales/en/user').then((m) => m.default));
await loadLocales(i18n, () => import('@workspace/i18n/resources').then((m) => m.resources));
```

`loadLocale`、`loadLocales` 每次都加载并按参数合并；`safeAddLocale`、`safeAddLocales` 和安全加载方法只注册缺失的命名空间，不补写或覆盖已有命名空间。

`safeLoadLocale` 按实例、语言和命名空间合并并发任务，第一个调用的加载器及合并参数生效。`safeLoadLocales` 无法在加载前得知语言和命名空间，因此仅按实例和加载器引用合并并发任务；要复用任务，请复用同一个加载器函数。加载完成后会重新检查命名空间，避免覆盖等待期间添加的资源。失败会清理任务，后续可以重试；不同实例的加载互不影响。

执行 `pnpm --filter @workspace/i18n test` 会构建并验证资源隔离、并发加载、失败重试、语言检测以及中英文键名和插值参数的一致性。

### UMD 使用示例

UMD 单文件仅包含核心 API，加载器由宿主提供；无需把语言数据打进核心脚本。下面的 JSON URL 是应用自行部署的静态资源，不由本包自动生成。实际使用前需加载 i18next、react-i18next 及其依赖的浏览器版本。

```js
const jsonLoader = (url) => async () => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
  return response.json();
};

const {i18n, ready} = BadProjectI18n.createI18n({
  lng: 'zh',
  fallbackLng: 'zh',
  loaders: {
    zh: {translation: jsonLoader('/locales/zh/translation.json')},
    en: {translation: jsonLoader('/locales/en/translation.json')},
  },
});
await ready;
await i18n.changeLanguage('en');
```

## 打包配置说明

本文对应同目录的 `rollup.config.ts`、`tsconfig.build.json` 和 `package.json`。配置文件保留简短注释，原理与备选方案集中在本文。

### 构建的整体流程

一次 Rollup 命令执行 ESM/CJS 多入口构建、UMD 核心构建和三个入口的声明构建：

```text
src/index.ts + src/locales/index.ts + src/resources.ts
├── typescript → Rollup → ESM / CJS 多入口及独立语言 chunks
└── dts → index.d.ts / locales.d.ts / resources.d.ts
src/index.ts → typescript → Rollup → UMD 核心（无内置语言数据）
```

| 产物                    | 用途                                                          |
| ----------------------- | ------------------------------------------------------------- |
| `dist/cjs/index.cjs`    | CommonJS 运行时入口                                           |
| `dist/esm/index.mjs`    | ESM 运行时入口                                                |
| `dist/umd/index.js`     | UMD 浏览器脚本入口，代码包装兼容 CommonJS、AMD 和全局变量模式 |
| `dist/types/index.d.ts` | 类型检查和编辑器提示                                          |
| JS 旁的 `.map` 文件     | 将打包代码位置映射回源码                                      |

仓库根目录的 `pnpm --filter @workspace/i18n build` 先清理本包 `dist`，再执行 Rollup，避免遗留旧产物。

命令中的 `--configPlugin typescript` 用于加载 TS 编写的 Rollup 配置文件；配置内的 `typescript(...)` 处理库源码。两者处理的对象不同。

### 为什么分开运行时与声明配置

#### 运行时实现与类型声明

源码同时包含实现与类型：

```ts
export function greet(name: string): string {
  return `Hello ${name}`;
}
```

运行时 JS 保留函数实现，移除类型标注；声明产物只保留调用约束：

```ts
export declare function greet(name: string): string;
```

`.d.ts` 不能执行函数，也不能代替 JS。它告诉 TypeScript 如何检查调用。

#### 插件的分工

运行时配置使用 `typescript()` 编译 TS，再由 Rollup 输出 JS，该阶段关闭声明输出。声明配置使用 `dts()` 直接读取各入口源码，生成并汇总声明，不依赖运行时 JS 产物。

`defineConfig([...])` 中各对象具有自己的输入、插件和输出。数组让一次命令完成多个构建，各构建并不自动串联输入和输出。

仅保留 `dts()` 配置，就只有类型声明，没有可运行的库；仅保留当前运行时配置，则不会生成声明。直接将两个插件放到同一条插件链，也不能让它们各自自动生成不同种类的产物。

分开配置是本库的组织方式，不是所有库的硬性要求。也可以让 TS 生成 JS 和逐文件声明，再用额外流程汇总声明；这里选择将不同产物的处理分开。

### Rollup 的输入与输出

#### defineConfig 与 input

`defineConfig` 提供配置类型提示，本身不编译源码。ESM/CJS 使用对象形式的多入口，分别生成核心、加载器映射和全量资源文件，动态导入的语言文件输出到 `locales/` 目录。UMD 只构建核心入口；声明构建分别收集三个公开入口的类型。

#### file 与 format

ESM/CJS 使用 `output.dir`、`entryFileNames` 和 `chunkFileNames` 支持代码拆分；UMD 使用 `output.file` 输出单文件。输出路径需与包清单 `exports` 保持一致。

| 字段         | 当前路径                | format                  |
| ------------ | ----------------------- | ----------------------- |
| `pkg.main`   | `dist/cjs/index.cjs`    | `cjs`                   |
| `pkg.module` | `dist/esm/index.mjs`    | `es`                    |
| `pkg.unpkg`  | `dist/umd/index.js`     | `umd`                   |
| `pkg.types`  | `dist/types/index.d.ts` | `es`，配合 dts 输出声明 |

`format` 决定生成的语法，文件后缀决定 Node 如何识别文件。两者需要一致，改后缀不会转换代码语法。

声明配置中的 `format: 'es'` 表示声明使用 ES 模块导入导出形式，不意味着输出可执行 ESM JS。该配置使用的是 `dts()`。

#### sourcemap

`output.sourcemap` 控制最终 JS 的 Source Map。结合 TS 插件的 `sourceMap`，可以将最终产物位置映射回原始 TS 源码，方便调试。本库根据 BUILD_ENV 同时切换两者；它不改变模块格式，也不负责类型检查。

#### UMD 的 name 与 globals

`name: 'BadProjectI18n'` 指定浏览器全局变量模式下的库名称，例如 `globalThis.BadProjectI18n`。

`globals` 把外部包名映射为浏览器全局变量：

```ts
globals: {
  i18next: 'i18next',
  'react-i18next': 'ReactI18next',
}
```

这不会下载或打包依赖。普通 `<script>` 模式下，页面需要提前加载依赖，提供对应全局变量，以及依赖自身需要的运行条件。

UMD 使用 `.js`，主要通过 CDN 作为浏览器普通脚本加载；服务端仍需返回正确的 JavaScript MIME 类型。浏览器普通脚本不读取目录中的 `type`。Node 用户使用本库专门的 `.cjs/.mjs` 入口，不能仅因 UMD 有 CommonJS 分支就认定其 `.js` 在所有 Node 包作用域中都能用 require 加载。当前 UMD 外置依赖，不是包含所有依赖的独立文件。

### external 与依赖管理

#### external 是什么

`external` 告诉 Rollup 哪些模块不应内嵌进产物。函数返回 `true` 时，保留对该模块的外部引用，不复制实现。

例如 `i18next` 外置后，ESM 通过 `import` 引用它，CJS 通过 `require` 引用它，运行时仍需要它。外置不等于删除依赖，也不等于不安装依赖。

#### 包名与子路径的匹配

```ts
const dependencies = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})];
const external = (id: string) => dependencies.some((name) => id === name || id.startsWith(`${name}/`));
```

`Object.keys` 提取包名，不取版本号；`|| {}` 允许清单缺少相应字段。`id` 是待处理的模块标识。

精确匹配覆盖包入口，带 `/` 的前缀匹配覆盖子路径。例如声明 `i18next` 后：

| id                   | 结果                                 |
| -------------------- | ------------------------------------ |
| `i18next`            | 外置                                 |
| `i18next/某个子路径` | 外置，实际可用性由依赖的导出规则决定 |
| `i18next-other`      | 不因 i18next 而匹配                  |
| `./local-module`     | 不匹配这些包名，仍参与内部模块打包   |

这条规则针对包名引用，不是所有 `node_modules` 绝对路径的通用匹配。

#### 为什么 dependencies 也外置

本库选择让包管理器安装运行依赖，再由应用的依赖图解析，而不是把第三方实现复制进本库产物。

这样可以减少内嵌副本，让应用构建器统一处理依赖，并让兼容版本有机会被包管理器去重。外置本身不保证应用只安装一个版本或只存在一个实例。

这是库发布策略，不是 Rollup 的强制规则。希望直接加载的独立浏览器文件，也可以选择内嵌依赖。

内嵌某个依赖需要调整外置规则，并按依赖格式提供解析、转换能力，例如 `@rollup/plugin-node-resolve`、`@rollup/plugin-commonjs`。仅删除 `external` 不保证能正确打入依赖。

也可以让 ESM/CJS 外置、UMD 内嵌，但需要区分外置规则与构建插件。当前三个 JS 输出共用同一个 `external`，因此都外置依赖。

#### 外置是否必须配置 peerDependencies

不必须。这些字段解决不同问题：

| 配置               | 职责                                 |
| ------------------ | ------------------------------------ |
| `dependencies`     | 声明本库运行需要安装的依赖           |
| `peerDependencies` | 声明宿主需要提供的共享依赖及兼容范围 |
| `devDependencies`  | 声明开发、构建、检查所需工具         |
| `external`         | 决定哪些依赖实现不内嵌进产物         |

普通内部运行依赖可以放在 `dependencies` 并外置，安装本库时包管理器仍会安装它。

如果公共 API 或集成方式要求与宿主共享依赖，例如 React 上下文或应用管理的 i18next 实例，通常更适合声明为 peer 并外置，再用开发依赖提供本地开发版本。是否使用 peer 取决于集成约定，不取决于是否外置。

现代包管理器可能自动安装 peer，但它表达的仍是宿主兼容关系，也不自动保证实例唯一。共享实例仍需应用管理和传入。

当前本包只有 `i18next`、`react-i18next` 两个运行依赖，没有声明 peer。外置规则收集两类包名，是为了兼容后续新增 peer，并非当前已有 peer。

#### 声明构建的 external

声明也可能引用第三方类型。这里复用外置规则，保留这些类型的包引用，不复制第三方声明。`rollup-plugin-dts` 默认也会外置 `node_modules` 中的外部类型。消费者通过安装的依赖解析相应类型。

### TypeScript 插件与 tsconfig.build.json

#### typescript 插件

```ts
typescript({tsconfig: './tsconfig.build.json'});
```

插件读取配置，编译 TS 语法、移除类型标注，向 Rollup 提供 JS 和映射信息，并提供编译诊断。最终 CJS/ESM/UMD 格式由 Rollup 决定。

`tsconfig` 路径相对于执行 Rollup 的工作目录；本包的工作区命令在 `packages/i18n` 中执行。

#### extends 与 compilerOptions

`extends: './tsconfig.json'` 继承本包配置，它又继承共享的 `tooling/typescript-config/base.json`，继续复用 target、module、strict 等选项。当前 TS 保留 ES 模块语法，供 Rollup 分析。

`compilerOptions` 配置编译行为。子配置同名编译选项覆盖父配置；`include`、`exclude` 数组替换父配置对应数组，不是追加。配置中的相对路径按所在配置文件解析。

#### rootDir

`rootDir: './src'` 指定源码根目录，作为生成文件目录结构的基准。需要输出的源码应位于这里。

它不选择编译文件，也不替代 Rollup 输出路径；文件范围由 include、exclude 与导入关系共同决定。

#### composite

`composite: false` 关闭用于 TS 项目引用的 composite 模式，不按可引用 TS 项目的约束组织产物。本库由 Rollup 处理产物、Turbo 编排工作区构建。

它不代表关闭所有增量编译，`incremental` 是另一个选项。

#### declaration

`declaration: false` 关闭 TypeScript 插件阶段的 `.d.ts` 输出，避免与独立声明构建重复承担职责。

它不会取消 `dts()` 的声明生成；dts 会为自己的声明构建使用相应编译选项。

#### declarationMap

`declarationMap: false` 不生成 `.d.ts.map`。声明映射用于从声明跳转到原始源码，与运行时 JS 的 Source Map 不同。

#### sourceMap

`sourceMap: true` 提供 TS 编译阶段的映射。Rollup 据此合成最终 `.map`，需要配合 `output.sourcemap: true`。当前运行时配置向 TypeScript 插件显式传入 `sourceMap: sourcemap`，覆盖此默认值，使生产构建同时关闭两个阶段的映射。

#### include

`include: ['src']` 将 src 中匹配的文件作为 TS 编译入口范围，覆盖父配置中同时包含 `rollup.config.ts` 的范围。

`tsconfig.json` 用于检查源码和构建配置；`tsconfig.build.json` 用于生成库产物，避免将构建配置本身当成库源码输出。

#### exclude

| 配置           | 作用                                             |
| -------------- | ------------------------------------------------ |
| `node_modules` | 不将安装依赖作为本库源码入口扫描                 |
| `dist`         | 不将已有产物再次作为入口扫描                     |
| `**/*.test.ts` | 排除任意层级的该命名测试文件，不覆盖其他测试命名 |

exclude 只过滤 include 的扫描结果，不是禁止导入的规则。显式导入的文件仍可能参与编译，第三方类型声明也仍可参与检查。

### 模块格式的识别方式

#### 明确后缀方式

Node 始终将 `.mjs` 识别为 ESM、`.cjs` 识别为 CommonJS，不受上级清单的 type 影响。

因此 ESM/CJS 目录不必生成额外的 `package.json`。UMD 的 `.js` 面向浏览器普通脚本，也无需目录级模块标记；如果要额外支持 Node 将这个 UMD 文件按 CommonJS 加载，可以单独为 UMD 目录增加 `{"type":"commonjs"}`。根包清单仍然需要，用于声明入口、依赖和发布范围。

#### 目录级 package.json 方式

也可以统一使用 `.js`，通过最近的 `package.json` 的 type 指定格式。这同样是官方支持的方式。

切换时，将 main、module、unpkg、jsdelivr 和 exports 中的运行时路径改成对应的 `index.js`，类型入口保持不变。然后增加 path 导入，将以下插件加入运行时配置的 plugins，保留 TypeScript 插件：

```ts
import path from 'node:path';

const outputModuleFormat = {
  name: 'output-module-format',
  writeBundle(output) {
    const directory = path.dirname(output.file!);
    fs.writeFileSync(
      path.join(directory, 'package.json'),
      JSON.stringify({
        type: output.format === 'es' ? 'module' : 'commonjs',
      }) + '\n'
    );
  },
} satisfies import('rollup').Plugin;

// 运行时配置：
// plugins: [outputModuleFormat, typescript({tsconfig: './tsconfig.build.json'})]
```

示例沿用当前文件的 fs 导入，假设使用 output.file。改成 output.dir 时，应同步调整目录获取逻辑。`output.file!` 是 TS 非空断言，不会提供运行时检查。

name 用于日志与错误信息。writeBundle 在每个输出写入磁盘后触发，生成对应目录的清单：ESM 使用 `{"type":"module"}`，CJS/UMD 使用 `{"type":"commonjs"}`。

插件数组不是每个插件完成全部工作后才执行下一个。即使该插件排在 typescript 前面，writeBundle 仍然在输出写入阶段调用。

两种识别方式都规范，本库为 ESM/CJS 选择明确后缀，UMD 保留浏览器脚本的 `.js`，减少额外文件和插件。

### 包入口与发布范围

#### exports 与其他入口字段

exports 定义按包名访问的公共入口：import 指向 ESM，require 指向 CJS，types 指向声明，default 提供运行时兜底入口。types 条件放在前面，让类型解析优先匹配；运行时不会因此执行声明文件。

main 是传统主入口；module 是许多构建器使用的 ESM 字段，Node 不通过该字段选择入口；types 是传统类型入口；unpkg、jsdelivr 是对应 CDN 的入口约定。

支持 exports 的 Node 优先使用它，所有入口应与实际产物路径一致。

#### 选择文件与识别格式

exports 的 import/require 决定选择哪个文件，不负责转换或标记该文件格式。格式仍由后缀或目录级 type 决定。

把一个 CJS 文件写进 exports.require，不会自动让 type 为 module 的目录中的 `.js` 变成 CommonJS。

#### files

`files: ['dist']` 指定主要发布内容为产物目录，包管理器还会按自身规则包含根清单、README 等必要文件。它不决定编译范围、依赖归属或模块格式。

### 本包的构建环境变量

#### 局部文件与加载方式

`packages/i18n/.env` 保存本库的构建选项，当前默认值为：

```dotenv
BUILD_ENV=development
```

Rollup 配置通过 Node 内置的 `loadEnvFile(new URL('./.env', import.meta.url))` 显式读取本包文件。路径相对于配置文件，既不自动读取仓库根目录的 `.env`，也不读取其他库的文件；无需安装 dotenv。

该文件应保留在本地源码仓库中，仅保存可公开的构建选项，不放密钥；发布范围为 dist，不会随库产物发布它。文件缺失会报错，不会静默选择其他目录的配置。

#### BUILD_ENV 与 Source Map

| BUILD_ENV     | TypeScript sourceMap | Rollup sourcemap |
| ------------- | -------------------- | ---------------- |
| `development` | 开启                 | 开启             |
| `production`  | 关闭                 | 关闭             |

只需修改本包 `.env` 后重新构建。变量未定义时回退到 development；其他值（包括空字符串）会报错，避免拼写错误导致构建行为不明确。此变量只控制当前显式连接的 Source Map 开关，不会自动改变 NODE_ENV、压缩方式或其他库的配置。

生产模式仍生成运行时 JS 和类型声明。构建脚本会先清理 dist，避免上次开发构建的 `.map` 留在生产产物中；直接执行 Rollup 或切换 watch 模式时应自行清理旧产物。

#### 进程环境的优先级与隔离

loadEnvFile 将文件变量加载到 process.env，但不会覆盖进程中已有的同名值。因此优先级为“已有进程环境 > 本包 .env > 代码默认值”。

例如直接启动本包构建的父进程已有 BUILD_ENV=production，即使文件写 development，仍使用 production。分别启动的包构建进程不会因读取同名变量而修改彼此的环境；同一进程中连续加载不同库文件则共享 process.env，不能视为目录隔离。

#### Turbo 缓存

根 turbo.json 的 build.inputs 已包含 `.env*`，本包文件变化会影响构建缓存，不需要为了局部文件设置 globalEnv。

当前未向 Turbo 声明 BUILD_ENV。若未来要通过父进程统一覆盖，应把该变量加入相应任务的 env 或全局 globalEnv，让 Turbo 在严格模式下传递它，并将它纳入缓存计算；只配置 passThroughEnv 不足以追踪值变化。

### 官方参考

- [Rollup external](https://rollupjs.org/configuration-options/#external)
- [Rollup 输出格式](https://rollupjs.org/configuration-options/#output-format)
- [Rollup writeBundle](https://rollupjs.org/plugin-development/#writebundle)
- [TypeScript 插件](https://github.com/rollup/plugins/tree/master/packages/typescript)
- [rollup-plugin-dts](https://github.com/Swatinem/rollup-plugin-dts)
- [Node 模块识别](https://nodejs.org/api/packages.html#packagejson-and-file-extensions)
- [TypeScript 配置参考](https://www.typescriptlang.org/tsconfig/)
- [Node loadEnvFile](https://nodejs.org/api/process.html#processloadenvfilepath)
- [Turbo 环境变量与缓存](https://turborepo.dev/docs/crafting-your-repository/using-environment-variables)
