# bad-project

基于 pnpm workspace 和 Turbo 的多项目仓库，包含前后端应用、可独立发布的功能包及共享工程配置。

本文位于 `docs/README.md`，文中的项目路径均相对于仓库根目录；命令默认在仓库根目录执行。Turbo 的概念、配置含义和执行示例见 [Turborepo 介绍与项目使用说明](./turborepo.md)。

测试工具、Vitest 共享配置和后续组件、交互测试方向见 [测试知识与项目约定](./testing.md)。

## 目录与职责

| 目录 | 职责 |
| --- | --- |
| apps/frontend/react-vite-admin | 后台应用，使用 Vite；通过源码别名消费内部功能包 |
| apps/frontend/next-app | Next.js 应用，保留 Next 专用配置 |
| apps/frontend/demo | 功能包产物演示，按包的 exports 解析，不配置源码别名 |
| apps/backend/nest-learn | NestJS 后端学习项目 |
| packages/ui-base | 基于 Base ui-base 的 React UI 库、独立演示页面及 Storybook |
| packages/editor | React 编辑器库及独立演示页面 |
| packages/i18n | 国际化实例创建、资源维护及翻译工具 |
| packages/mock | 基于 Faker 的模拟数据工具 |
| packages/supabase | 客户端创建与认证、profiles 业务方法 |
| packages/utils | 通用工具方法 |
| tooling/eslint-config | 共享 ESLint 规则及产物忽略清单 |
| tooling/typescript-config | 按场景共享的 TypeScript 配置 |
| tooling/vitest-config | 共享 Vitest 测试环境与文件匹配规则 |
| tooling/prettier-config | 仓库统一的 Prettier 格式规则，由根配置转发 |

workspace 覆盖 apps/frontend/*、apps/backend/*、packages/* 和 tooling/*。共享配置已从 apps/frontend/tool 移到 tooling；旧 scripts/build.js、scripts/dev.js 已由 Turbo 编排替代。

应用维护入口、路由、环境变量和实例生命周期；功能包维护公共 API、依赖和发布产物；tooling 维护静态检查配置。各功能包继续独立维护自己的构建配置，不集中到 tooling。

## 环境与首次安装

根 package.json 的 engines 声明 Node.js >=24.22.1、npm >=12.2.0、pnpm >=12.14.0。根工程与子模块均不设置旧的顶层 packageManager；根 devEngines.packageManager 声明 pnpm 版本范围 `^12.14.0`，供 Turbo 识别包管理器，并通过 onFail: error 拒绝不符合开发要求的版本。Turbo 要求该范围仅覆盖一个大版本，因此当前开发工具链使用 pnpm 12；engines 保留最低兼容版本声明。在仓库根目录统一安装工作区依赖时，根约束覆盖该安装流程；子模块独立移出工作区或发布后不会继承根 engines。

```bash
pnpm install
pnpm typecheck
pnpm build:packages
```

在仓库根目录安装，使用 pnpm-lock.yaml 记录解析结果。增加依赖时通过 --filter 选择所属工作区，根工程开发依赖使用 -Dw：

```bash
pnpm --filter @workspace/utils add <运行时依赖>
pnpm --filter @workspace/utils add -D <开发依赖>
pnpm add -Dw <根工程开发工具>
```

## TypeScript 配置

项目 TypeScript 固定为 6.0.3；根 devDependencies 与 pnpm-workspace.yaml 的 overrides 统一版本。VS Code 的项目 SDK 路径已指向 node_modules/typescript/lib，编辑器诊断应使用项目版本。

| 共享配置 | 用途 |
| --- | --- |
| @workspace/typescript-config/base.json | 普通工具库、后端等基础编译选项 |
| @workspace/typescript-config/vite.json | Vite 配置脚本的 bundler 解析、无输出及检查选项 |
| @workspace/typescript-config/react.json | 在 vite.json 上增加 React JSX 支持 |
| @workspace/typescript-config/next.json | Next 应用的通用 TS 选项 |

子项目通过 extends 直接继承 @workspace/typescript-config 中对应的配置，自己维护 target、lib、types、include/exclude、路径映射和严格模式。共享配置统一维护在 tooling/typescript-config，不再提供根目录转发入口。

已移除 baseUrl、downlevelIteration 等旧选项，适用配置使用 moduleResolution: bundler。editor 保留原有非严格检查行为，严格模式迁移需要单独处理。

ui-base/editor/后台分别检查 tsconfig.app.json 和 tsconfig.node.json，避免遗漏构建配置脚本；ui-base 还检查 tsconfig.storybook.json。Next 的 typecheck 先执行 next typegen，再执行 tsc --noEmit。

Rollup 功能包使用两个配置文件：

- tsconfig.json：检查源码及 rollup.config.ts。
- tsconfig.build.json：仅包含 src，设置源码 rootDir，并关闭 composite、declaration、declarationMap；JS 由 TypeScript 插件编译，声明由 rollup-plugin-dts 生成。

## ESLint 与依赖归属

共享包 @workspace/eslint-config 导出 base.js、react.js 和 ignores.js。ignores.js 统一忽略 node_modules、dist、dist-lib、dist-app、.next、.turbo、.rollup.cache 等生成目录，防止缓存声明文件参与源码检查。

base.js、react.js 只提供各自的检查规则，不内置 Prettier 冲突处理。使用方按需调用导出的 with-prettier.js，例如 withPrettier(reactConfig)，在最终规则列表末尾关闭与 Prettier 冲突的规则。eslint-config-prettier 依赖及实现仍由共享包维护，应用无需自行安装或导入它。Next 在自身规则组合完成后使用相同包装函数。该配置不执行格式化，格式化仍由独立的 Prettier 命令负责。mock 复用 base.js 并显式包装，不额外加载浏览器 globals 或类型检查项目。

Next 保留 ESLint 9 和专用 Next 配置，共享忽略清单及 Prettier 冲突规则包装函数；其他项目使用 ESLint 10。当前 Next 配置涉及的 React ESLint 插件与 ESLint 10 存在兼容问题，升级需要另行验证。

根 eslint.config.js 使用共享 base.js 并调用 withPrettier，作为没有独立配置的目录的兜底。pnpm lint 通过 Turbo 分别调用各包的 lint，不额外检查仓库根目录文件；pnpm lint:root 则直接运行根目录的 ESLint 10，递归扫描仓库。ESLint 10 从待检查文件所在目录向上寻找配置，子项目使用自己的配置，其余文件使用根配置，不自动叠加两者。

根基础配置为 TS/TSX 设置检查规则；JS/MJS/CJS 默认会被扫描，但该配置没有为它们设置推荐规则。JSON、Markdown、CSS 不在当前 ESLint 检查范围内；生成目录按忽略清单排除。

功能包把 @workspace/eslint-config、@workspace/typescript-config、eslint、typescript 放在 devDependencies。共享 ESLint 包自身加载的插件放在它的 dependencies，避免使用方重复声明。

| 依赖类别 | 使用原则 |
| --- | --- |
| dependencies | 发布后公共 API 运行所需的普通依赖，例如 Faker、Supabase SDK |
| devDependencies | 本包开发、构建、检查或演示所需工具 |
| peerDependencies | 与宿主共享、需要声明兼容范围的依赖，例如 React |
| 根 pnpm-workspace.yaml 的 overrides | 统一仓库内解析版本，不代表发布包要求宿主使用完全相同版本 |

ui-base 的 React、React DOM 已从 dependencies 移到 devDependencies，并保留 peerDependencies：本地独立开发使用开发依赖，安装发布包的应用按 peer 关系提供兼容 React。editor 同样通过 devDependencies 和 peerDependencies 管理 React。ui-base 声明支持 React 18/19，当前开发和构建使用 React 19；React 18 兼容性仍需单独验证。

## Prettier 格式配置

原根 .prettierrc 的规则已移到 tooling/prettier-config/index.js；根 prettier.config.js 只负责转发。规则值保持不变，包括两空格缩进、分号、单引号、120 字符换行，以及 Tailwind 类名排序和 cn/cva 函数支持。

Prettier 从待格式化文件所在目录向上查找配置，所以根命令、ui-base 的 format 命令和后台的格式命令仍可使用统一规则。编辑器使用 Prettier 时也可以发现根入口，不需要为每个子项目额外指定 --config。[配置查找说明](https://prettier.io/docs/configuration)

tooling/prettier-config 当前是共享配置目录，通过相对路径导入，未创建新的工作区包；Prettier 和 Tailwind 插件仍使用现有依赖声明，无需为了迁移安装新依赖。

.prettierignore 保留在根目录，因为它管理本仓库的忽略范围。CLI 默认从执行目录读取忽略清单，不会因导入 tooling 配置自动读取那里的忽略文件。移走后需要显式配置 --ignore-path，并对齐编辑器设置；/dist 等路径还以忽略文件所在目录为基准，直接移动会改变匹配范围。[忽略文件说明](https://prettier.io/docs/ignore)

配置规则的向上查找与忽略清单的查找方式不同；在子项目目录直接执行 Prettier 时，若需要根忽略清单，应通过 --ignore-path 指定其路径。此次仅迁移格式规则，忽略内容和现有命令保持不变。

## 根目录命令

| 命令 | 行为 |
| --- | --- |
| pnpm dev / pnpm dev:admin | 启动后台应用 |
| pnpm dev:next | 启动 Next 应用 |
| pnpm dev:demo / pnpm dev:demo:dist | 构建 demo 的依赖包，然后启动产物演示 |
| pnpm build / pnpm build:all | 构建各应用和功能库，不包含 ui-base/editor 的独立演示页面 |
| pnpm build:packages | 构建 packages 下的功能库及其依赖 |
| pnpm build:apps | 构建 apps 下的应用及其依赖 |
| pnpm build:package-apps | 单独构建 ui-base/editor 演示页面 |
| pnpm build:demo:dist | 构建 demo 依赖产物及 demo |
| pnpm typecheck | 全仓库实际源码配置的类型检查 |
| pnpm typecheck:packages | 功能包类型检查及其依赖构建 |
| pnpm lint / pnpm lint:packages | 全仓库 / 功能包 ESLint 检查 |
| pnpm lint:root | 直接从根目录运行 ESLint，子项目使用各自配置，其余文件使用根配置兜底 |
| pnpm prettier / pnpm prettier:fix | 格式检查 / 格式修改 |
| pnpm changeset | 创建待发布变更说明 |
| pnpm changeset:version | 应用变更说明，更新版本及 CHANGELOG |
| pnpm release | 通过 Changesets 执行 npm 发布 |

根构建、开发及 lint/typecheck 工作区检查命令由 Turbo 编排；lint:root 直接执行 ESLint，不使用 Turbo 的任务缓存。单独进入包执行命令时，需要自行保证依赖产物存在。

## 构建器与产物

| 功能包 | 构建器 | 库产物 |
| --- | --- | --- |
| i18n、mock、supabase、utils | Rollup，各自维护 rollup.config.ts | dist/esm、dist/cjs、dist/umd、dist/types |
| ui-base | Vite，通过 lib 模式构建 ESM，tsc 生成声明 | dist-lib/index.js、dist-lib/types、dist-lib/css |
| editor | Vite，分别维护基础、ESM 和 UMD 配置 | dist-lib/esm、dist-lib/umd、dist-lib/types、editor.css |

Rollup 包的 build 先清理 dist 再构建；dev 为监听构建。声明入口统一位于 dist/types/index.d.ts。

ui-base/editor 的命令分工：

| 子包命令 | 行为 |
| --- | --- |
| build | ui-base 检查类型、通过 Vite lib 模式构建 ESM，再由 tsc 生成声明；editor 调用 build:lib |
| build:lib | 仅 editor 提供，检查类型并构建库 |
| build:app | 检查类型并构建演示页面到 dist-app |
| dev | 启动包自身的演示开发服务器 |
| storybook / build-storybook | ui-base 的组件文档开发 / 静态构建 |
| prepack | editor 在打包、发布前调用 build:lib；ui-base 未配置此脚本 |

ui-base 在 vite.config.ts 中区分库构建和演示构建；库仅生成 ESM，保留模块结构，不提供 UMD 或 require 入口。files 仅包含 dist-lib，演示产物不包含在库压缩包中。ui-base 当前设置 private: true，仅供工作区使用。

ESM 使用 import/export；CJS 使用 require/module.exports；UMD 用于浏览器 script 等加载方式。构建器 external 配置与 package.json 的依赖声明是两件事：前者决定是否将依赖打进产物，后者决定安装及兼容关系。

## 发布入口与样式

Rollup 包的主导出结构为：

```json
{
  "exports": {
    ".": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js",
      "default": "./dist/esm/index.js"
    }
  },
  "files": ["dist"],
  "publishConfig": {"access": "public"}
}
```

types 条件放在前面；路径应指向实际文件。Node 模块格式可以通过 .mjs/.cjs 后缀明确指定，也可以通过 package.json 的 type 声明。ui-base 的 ESM .js 使用包根的 type: module。

ui-base 当前为 private，editor 可发布。两者的 files 均只包含 dist-lib：

- ui-base 的公共组件、Hooks 和工具可从 @workspace/ui-base 根入口导入；同时提供 components/ui/*、theme-provider、components/theme-switch、lib/*、hooks/* 等公开子路径，具体以 package.json 的 exports 为准。
- ui-base 的 style.css 指向 dist-lib/css/style.css，包含主题、组件样式和共享滚动条样式；应用自定义颜色、间距和动画由应用自身维护。
- ui-base 的 font.css 是独立的可选 Geist 字体入口，不由主样式或根 JS 自动加载。使用库组件时仍需显式引入全局 CSS。
- ui-base 的 styles/source/* 指向工作区中的 src/styles/*。Next 使用 @workspace/ui-base/styles/source/index.css，由应用的 Tailwind 编译，并通过 @source 注册应用源码扫描范围；源码样式不需要先构建库，也不在仅包含 dist-lib 的压缩包中。
- editor 的样式统一通过 editor.css 导入，指向编译后的 editor.css；不再复制或导出 styles/* 源样式目录，演示用 global.css 不随 npm 包发布。
- editor 的声明插件明确 rootDir 为 src，直接生成 dist-lib/types/index.d.ts，无手写桥接入口。
- editor 的 UMD 使用外部依赖时，需要按构建配置的 globals 提供依赖，不能默认认为一个 script 文件已包含全部依赖。

## 源码消费与产物消费

### 后台应用：源码消费

react-vite-admin 的 vite.config.ts 将 @workspace/ui-base、@workspace/editor 等别名指向 packages 对应的 src；tsconfig.app.json 使用 paths 对齐编辑器和类型检查。

应用组件从 @workspace/ui-base 根入口导入。ui-base 内部的 @ui-base 别名指向 packages/ui-base/src；style.css 和 font.css 分别显式映射到库的源码样式文件。应用在自己的构建过程中编译这些文件；源码别名不表示这些内部路径是发布包的公共入口。

后台样式入口直接引入 tailwindcss，启用应用源码的自动扫描；ui-base 自身的样式入口关闭自动扫描，仅显式扫描库源码，因此只引入库源样式的 Next 应用需要另行声明 @source。

workspace 链接让包可被找到；Vite alias 选择实际源码路径；TS paths 提供静态解析。仍需 import、@import 或 glob 才会加载文件，不会因为 workspace 链接就自动加载整个包。

### demo：产物消费

demo 当前源码只演示 @workspace/utils，且只提供 dist 模式。它没有功能包源码别名或 TS 源码 paths，按 package.json 的 exports 消费 workspace 包产物。

```bash
pnpm dev:demo:dist
pnpm build:demo:dist
```

这两个根命令先构建 demo 依赖；直接在 demo 内启动时需自行准备产物。功能包改动后重新运行根命令，更新构建结果再校验。

当前仅通过 workspace 链接演示产物消费，不等同于把 npm 压缩包安装进独立项目验证；未来源码模式可按 Vite mode 扩展，当前尚未提供。

## 应用级实例管理

### Supabase

公共包不读取环境变量，也不导出固定客户端实例。应用通过 createSupabaseClient 显式传入 URL、Key 和 SDK 选项，同一应用复用自己的实例：

```ts
import {createSupabaseClient, getPageProfiles} from '@workspace/supabase';

const supabase = createSupabaseClient(url, publishableKey);
const result = await getPageProfiles(supabase, 1, 10);
```

后台实例位于 apps/frontend/react-vite-admin/src/supabase/index.ts，调用方从 @/supabase 导入。signUp、signOut、updateUser 等公共业务方法的第一个参数均为客户端。

API 迁移：删除从 @workspace/supabase 导入 supabase 的方式；原 signUp(credentials) 改为 signUp(supabase, credentials)。不同应用或 SSR 请求自行管理实例生命周期和环境配置。

### i18n

createI18n 返回独立实例和初始化 Promise。getLngText、资源维护等方法使用传入实例，翻译前等待 ready：

```ts
import {createI18n, getLngText} from '@workspace/i18n';

const {i18n, ready} = createI18n({
  lng: 'zh',
  resources: {zh: {translation: {greeting: '你好，{{name}}'}}},
});
await ready;
const text = getLngText(i18n, 'greeting', {name: '张三'});
```

API 迁移：getLngText(key, values) 改为 getLngText(i18n, key, values)，不再使用 i18next 默认实例。后台已有实例位于 src/i18n/index.ts。

## Turbo 依赖与缓存

- build 和 typecheck 通过 ^build 先构建依赖包；lint 通过 ^lint 编排依赖检查。
- ui-base 的 build、editor 的 build/build:lib 缓存 dist-lib；build:app 缓存 dist-app。
- Next 缓存 .next，排除 cache 和 dev 子目录。
- 共享 tooling 配置及根 eslint.config.js 加入 globalDependencies，配置变更会影响缓存。
- build、build:lib、build:app 及包专用 build 规则显式补充 .env* 输入；demo 的 build:dist 使用默认文件输入，未显式补充环境文件。dev 是持续运行任务，不使用缓存。
- 配置包直接导出静态文件，没有占位 build/typecheck；普通占位 test 脚本已移除。

详细字段解释、任务顺序和缓存边界见 [Turbo 专题文档](./turborepo.md)。

## 打包与发布流程

先完成检查及库构建，再记录版本变更：

```bash
pnpm typecheck
pnpm lint
pnpm build:packages
pnpm changeset
pnpm changeset:version
```

Changeset 文件记录待处理的发版说明，应用版本时更新 package.json 和 CHANGELOG，并消耗这些说明文件。选择 patch/minor/major 应依据公共 API 兼容性；本轮 Supabase 和 getLngText 参数变更属于需要记录的接口不兼容变更，架构提交本身不会自动更新发布版本。

发布前可以生成压缩包检查内容：

```bash
pnpm --filter @workspace/editor pack --pack-destination /tmp/bad-project-pack
```

editor 的 prepack 自动构建库；ui-base 和其他 Rollup 包在打包前需自行构建。当前没有自动化的压缩包独立安装验证流程。

ui-base 为 private，不参与 npm 发布。其他可发布包准备好版本和 npm 登录后执行 pnpm release；直接发布单个包可以使用 pnpm --filter <包名> publish。Changesets 与各包 publishConfig 配置为 public。本地提交、打包、npm 发布和 Git 推送是独立操作。

## 当前验证范围与后续工作

此前架构改造阶段的验证包含共享配置解析、TS 类型检查、功能库和应用构建、demo 产物模式、Rollup 包 ESM/CJS 加载、Supabase 多客户端隔离、i18n 多实例与语言切换，以及 UI 独立开发启动。这是此前的验证记录，不代表当前所有未提交改动均已重新通过校验。

仍需单独推进：

- 源码 lint 错误与警告尚未全量清理，不应将构建成功理解为 lint 通过。
- 尚未建立完整自动化测试及 npm 压缩包安装验证流程。
- ui-base 声明的 React 18 兼容性尚待验证。
- demo 尚未提供源码模式。
- 构建中的原有未使用导入、模块指令及大 chunk 警告需要按业务需求评估。

更详细的说明：

- [Turborepo 介绍与项目使用说明](./turborepo.md)
- [React Hook Form 知识点与实践指南](./react-hook-form.md)
- [ui-base Storybook 开发指南](./storybook.md)
- [Next.js SEO 清单](./seo.md)
- [demo 产物演示](../apps/frontend/demo/README.md)
- [Supabase 使用说明](../packages/supabase/README.md)
- [i18n 使用说明](../packages/i18n/README.md)
