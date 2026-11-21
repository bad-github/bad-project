# Turborepo 介绍与项目使用说明

本文先介绍 Turborepo 的概念、适用场景和相关知识，再说明本仓库的配置与使用方式。两部分可以分别阅读。

项目整体架构、安装与发布流程见同目录的 [项目使用说明](./README.md)。文中的项目路径均相对于仓库根目录，命令默认在仓库根目录执行。

## Turborepo 介绍与扩展知识

### Turborepo 是什么

Turborepo 是面向 JavaScript / TypeScript 仓库的任务编排和缓存工具，命令是 `turbo`。它读取工作区中的包及其依赖关系，再调用各包 `package.json` 中的脚本。

例如执行 `turbo run build` 时，实际构建工作仍由各包自己的工具完成。Turbo 主要决定哪些任务要执行、先后顺序，以及能否复用上一次的结果。[官方任务说明](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks)

### 它主要解决什么问题

当一个仓库包含多个应用和共享包时，构建与检查往往需要跨包执行。随着包数量增加，容易出现以下问题：

- 依赖库尚未构建，应用就开始读取库的入口或类型声明。
- 每次全量校验，都重复构建没有变化的包。
- 无关包本来可以并行执行，却需要人工串行操作。
- 跨包脚本需要反复维护包名称和执行顺序。

Turbo 通过任务依赖描述执行顺序，通过并行调度利用独立任务之间的空闲资源，通过缓存复用已经完成且输入未变化的结果。各包原有的构建工具和脚本仍然可以独立维护。

### 适用场景

适合多个应用共享组件库、功能库的工作区，尤其是经常需要统一执行构建、lint、类型检查的项目。开发机和 CI 都可以使用相同的任务入口。

如果仓库只有一个小应用，执行一次构建的成本很低，普通 npm/pnpm 脚本通常就够用。缓存最适合输入和输出明确、结果可重复的任务；依赖外部实时状态的任务需要额外考虑缓存是否合适。

### 与同类方案的区别

| 方案 | 主要能力 | 适用特点 |
| --- | --- | --- |
| 普通脚本 | 自己组合命令与执行顺序 | 适合任务数量少、执行关系简单的项目 |
| pnpm 递归命令 | 按工作区选择包、拓扑排序、并发执行 | 已能解决批量执行问题，但递归执行本身不提供 Turbo 这样的任务结果缓存 |
| Turborepo | 在现有包脚本上增加任务依赖和缓存 | 适合已有工作区脚本、希望保留各包独立配置的仓库 |
| Nx | 任务图、缓存、受影响项目分析，以及插件、生成器等能力 | 适合需要更多项目生成和统一工程治理能力的仓库 |
| Lerna | 多包管理、版本发布和任务运行 | 现代 Lerna 的任务运行可使用 Nx 的能力，不能简单理解为“只能串行执行、没有缓存” |

这些工具的能力存在重叠，并非用了 pnpm 就不能用 Turbo。包管理、任务编排和版本发布可以由不同工具分别承担，应根据仓库规模和团队需求选择。

参考：[pnpm 递归执行](https://pnpm.io/cli/recursive)、[Nx 简介](https://nx.dev/docs/getting-started/intro)、[Lerna 任务运行](https://lerna.js.org/docs/features/run-tasks)。

### 核心工作原理

#### 工作区、包依赖图与任务依赖图

工作区把多个包放在同一个仓库管理。包依赖图描述“哪个包依赖哪个包”；任务依赖图进一步描述“哪个任务必须等待哪个任务完成”。

例如应用依赖组件库，并不意味着所有操作都必须先构建组件库。构建任务可以要求先构建依赖库，开发服务则可以直接读取库源码。具体顺序需要通过任务配置表达。

#### 并行执行与任务过滤

没有前置依赖的任务可以并行执行；有依赖的任务需要等待前置任务完成。过滤条件用于选择目标包，但目标任务所需的前置任务仍会纳入执行计划。

因此，“只选择一个应用”与“整个执行过程只运行这个应用的命令”并不等价。

#### 缓存输入、缓存输出与结果复用

缓存输入描述哪些变化会影响任务结果，缓存输出描述哪些生成文件需要保存和恢复。只有正确描述两者，缓存才能可靠地减少重复工作。

命中缓存时，Turbo 可以恢复声明的产物并回放日志；没有可用缓存时，才实际执行包脚本。缓存检查任务也可以只保存成功结果和日志，不保存文件产物。

任务应尽量具有可重复的结果。如果构建依赖未声明的环境变量或外部实时数据，输入相同也可能产生不同输出，需要补充输入约束或关闭缓存。

### 扩展知识与职责边界

#### 本地缓存与远程缓存

本地缓存主要供当前机器复用任务结果。远程缓存可以让开发机和 CI 共享结果，减少不同机器重复执行相同任务的成本。是否使用远程缓存，需要结合认证、访问权限和团队工作流配置。[缓存说明](https://turborepo.dev/docs/crafting-your-repository/caching)

#### 环境文件与环境变量

环境文件属于文件输入；终端或 CI 注入的环境变量则需要考虑变量传递和变量值对缓存的影响。把 `.env` 加入文件输入，并不意味着所有环境变量都已被追踪。[环境变量说明](https://turborepo.dev/docs/crafting-your-repository/using-environment-variables)

#### 开发服务与持续监听

构建和检查通常会执行结束，开发服务则会长期运行。启动前执行一次依赖构建，与启动后持续监听并重建依赖，是两种不同的行为，需要分别设计。

#### Turborepo 与 Turbopack 的区别

Turborepo 负责仓库任务编排；Next 中的 Turbopack 负责模块解析和打包。两者名称相似，但配置和职责不同。

源码别名、CSS 导入和组件热更新由应用的构建工具与包入口配置负责。Turbo 不负责解析这些导入，也不会替代 Vite、Rollup、Next、TypeScript 或 ESLint。

## 本项目中的使用说明

本部分基于当前仓库的 `turbo.json`、根 `package.json`、`pnpm-workspace.yaml` 和各包的构建脚本说明。根目录声明的 Turbo 版本为 `^2.9.9`，配置说明以本仓库为准。

### 引入原因与工具分工

本仓库同时包含多个应用、多个可发布的功能包，以及共享配置包。应用与库之间存在依赖，需要统一安排构建和校验，同时保持各包自己的构建配置。

当前配置把任务顺序和缓存集中到根目录，把具体构建方式留在各包自己的配置文件中。因此 i18n 等包仍然独立维护 Rollup 配置，ui-base/editor 仍然独立维护 Vite 配置。

ui-base/editor 的库构建和演示页面构建使用不同任务入口，避免发布所需构建与演示页面互相牵连。

| 工具 | 本项目中的职责 |
| --- | --- |
| pnpm | 安装依赖、链接工作区包、执行脚本 |
| Turborepo | 编排各包的任务、并行执行、缓存结果 |
| Vite | 构建前端应用、ui-base/editor 的库与演示页面，提供开发服务 |
| Rollup | 构建 i18n、mock、supabase、utils 功能包 |
| Next.js | 构建和运行 Next 应用 |
| TypeScript / ESLint | 类型检查、代码检查 |
| Changesets | 管理包版本和发布流程 |

Turbo 安装在根目录的 `devDependencies` 中，供仓库开发和构建使用。发布 editor 等 npm 包后，使用者不需要为了运行这些组件再安装 Turbo。

### 配置文件与工作区关系

| 文件 | 作用 |
| --- | --- |
| `pnpm-workspace.yaml` | 声明哪些目录属于工作区 |
| 根 `package.json` | 声明 Turbo 依赖与统一操作入口 |
| 各包 `package.json` | 声明包名、包依赖和实际执行的脚本 |
| 根 `turbo.json` | 声明任务顺序、缓存输入、缓存输出与开发任务属性 |
| 各包 Vite/Rollup/Next/TS 配置 | 决定真正如何编译、输出到哪里 |
| `.gitignore` | 排除依赖、构建产物和本地缓存等文件 |

Prettier 的规则另由 `tooling/prettier-config/index.js` 维护，根 `prettier.config.js` 转发，`.prettierignore` 保留在根目录。现有格式检查命令直接调用 Prettier，不经过 Turbo，也没有为其新增 Turbo 任务或全局缓存依赖；具体使用方式见 [项目的 Prettier 配置说明](./README.md#prettier-格式配置)。

#### 工作区范围

当前 `pnpm-workspace.yaml` 声明：

```yaml
packages:
  - 'packages/*'
  - 'apps/frontend/*'
  - 'apps/backend/*'
  - 'tooling/*'
```

这使应用、功能包和配置包都成为工作区成员。目录排列顺序不决定构建顺序，构建顺序来自包之间的依赖和 Turbo 的任务依赖。

同文件中的 `allowBuilds` 是 pnpm 对安装阶段依赖构建脚本的管理配置：`true` 允许执行，`false` 禁止执行，与 Turbo 的任务缓存不是一回事。

#### 包依赖与任务依赖

例如 demo 的 `package.json` 声明依赖 `@workspace/utils`。Turbo 据此知道 demo 依赖这个工作区包。

再结合 demo 开发任务的 `dependsOn: ["^build"]`，执行顺序就是：

```text
@workspace/utils 的 build → 完成后启动 @workspace/demo 的 dev:dist
```

没有依赖关系的任务可以并行执行；存在依赖关系时，按配置等待前置任务完成。

`workspace:*` 表示使用工作区中的包。至于应用读取该包的源码还是构建产物，仍由包的 `exports` 和应用的解析配置决定，Turbo 不负责选择导入入口。

只有包中存在对应脚本时，才有实际命令可执行。例如 TypeScript 配置包主要提供 JSON 文件，没有必要为了参与工作区而编造一个 `build` 脚本。

### `turbo.json` 的公共字段

#### `$schema`

```json
"$schema": "https://turborepo.dev/schema.json"
```

给编辑器提供配置格式校验和补全。它不会决定构建产物的位置。

#### `globalDependencies`

```json
"globalDependencies": [
  "tooling/eslint-config/*.js",
  "tooling/eslint-config/package.json",
  "tooling/typescript-config/*.json",
  "eslint.config.js"
]
```

这些路径相对于仓库根目录。它们是共享配置；内容发生变化时，任务缓存需要重新计算，避免继续复用旧配置下的结果。

| 路径 | 为什么纳入 |
| --- | --- |
| `tooling/eslint-config/*.js` | 共享 ESLint 规则会影响检查结果 |
| `tooling/eslint-config/package.json` | 配置包的入口和依赖变化可能改变规则加载 |
| `tooling/typescript-config/*.json` | 共享 TS 配置会影响编译和类型检查 |
| `eslint.config.js` | 根级 ESLint 配置影响检查行为 |

这里的 `*.js`、`*.json` 匹配对应目录的直接子文件，不递归匹配所有子目录。将这些配置设为全局依赖是较保守的策略：共享配置变化可能让部分实际上不受影响的任务也重新执行，但降低了错误复用缓存的风险。

#### `tasks` 与专用任务名称

`tasks` 中的 `build`、`lint` 等名称，对应各包 `package.json` 的同名脚本。

`@workspace/editor#build` 则只针对名为 `@workspace/editor` 的包。`#` 前面必须使用包的 `name`，并非目录名。因此 Next 的专用任务是 `next-app#build`。

通用 `build` 提供公共规则，包专用配置调整该包的行为。当前专用构建规则明确重复写出了依赖、输入和输出，阅读时可以直接看到完整约束。

#### `dependsOn`

本仓库最常见的配置是：

```json
"dependsOn": ["^build"]
```

`^build` 表示先执行当前包所依赖的工作区包的 `build`，并沿任务依赖继续处理其前置任务。

几种写法的区别：

| 写法 | 含义 |
| --- | --- |
| `^build` | 依赖包的 build |
| `build` | 当前包自己的 build |
| `@workspace/editor#build` | 指定 editor 包的 build |

这里的 `^` 是任务依赖语法，与版本号中的 `^2.9.9` 含义不同。包的工作区开发依赖也会参与依赖图，不只看运行时依赖。

##### Turbo 如何知道依赖了哪些包

当前根 `package.json` 通过 `devEngines.packageManager` 声明 pnpm `^12.14.0`，供 Turbo 识别包管理器；`engines` 不能替代这项声明。Turbo 要求该版本范围仅覆盖一个大版本。

Turbo 再根据 `pnpm-workspace.yaml` 找到工作区成员，再读取各包 `package.json` 的包名和依赖声明，结合包管理器的锁文件建立依赖图。它不会扫描源码里的 `import` 来猜测依赖关系。

以 `apps/frontend/demo/package.json` 的部分配置为例：

```json
{
  "name": "@workspace/demo",
  "dependencies": {
    "@workspace/utils": "workspace:*",
    "react": "^18.3.1"
  },
  "devDependencies": {
    "@workspace/eslint-config": "workspace:*",
    "@workspace/typescript-config": "workspace:*"
  }
}
```

Turbo 找到工作区里名为 `@workspace/utils` 的包，便知道它是 demo 的内部依赖。共享配置包也是内部依赖，但没有 `build` 脚本的配置包不会凭空执行构建命令。`react` 是外部 npm 依赖，不会被当作本仓库的包执行 `react#build`。

此时对 demo 配置 `dependsOn: ["^build"]`，相当于告诉 Turbo：“启动 demo 前，先完成内部依赖的构建。”Turbo 再读取 utils 的 `scripts.build`，调用真正的构建命令；已有可用缓存时则复用结果。

如果以后 demo 在 `package.json` 中新增一个工作区依赖，该依赖的构建就会按依赖图纳入前置任务，不必逐个把包名写入 `dependsOn`。反过来，只添加源码导入或路径别名、却没有声明包依赖，不能指望 `^build` 自动发现它。

#### `inputs`

```json
"inputs": ["$TURBO_DEFAULT$", ".env*"]
```

输入影响缓存标识。源码或相关配置变化后，Turbo 应重新执行任务。

- `$TURBO_DEFAULT$`：保留默认文件输入规则，避免自定义 `inputs` 后意外只跟踪少量文件。
- `.env*`：补充当前包目录中的环境文件，例如 `.env`、`.env.production`；环境文件即便被 Git 忽略，也需要考虑其变化。

这不会替构建工具加载 `.env`。读取环境文件仍由 Vite、Next 等工具负责。通过终端或 CI 注入的环境变量值，也不能仅靠文件匹配来完整描述。

##### 不配置 `inputs` 与不写 `$TURBO_DEFAULT$` 有什么区别

`$TURBO_DEFAULT$` 是 Turbo 内置的占位符，不是需要在终端设置的环境变量。它表示使用默认的文件输入范围；默认会考虑包目录中的文件，并遵循 Git 忽略规则。

| 配置方式 | 文件输入范围 | 对本项目的影响 |
| --- | --- | --- |
| 完全省略 `inputs` | 使用默认规则 | 普通源码变化会影响缓存；被 Git 忽略的环境文件通常不在默认范围内 |
| `"inputs": ["$TURBO_DEFAULT$"]` | 保留默认规则 | 仅就文件输入范围而言，与省略 `inputs` 相同 |
| `"inputs": ["$TURBO_DEFAULT$", ".env*"]` | 默认范围加环境文件 | 既跟踪源码，又补充环境文件变化，是当前构建任务的写法 |
| `"inputs": [".env*"]` | 自定义范围只列出环境文件 | 不再自动保留默认源码范围，源码变化可能无法使任务缓存失效 |

例如 ui-base 的 `src/components/ui/button.tsx` 和被忽略的 `.env.production` 都可能影响构建：

```text
省略 inputs：
  修改 button.tsx       → 文件输入发生变化，重新构建
  修改被忽略的环境文件 → 默认文件输入可能感知不到变化

inputs 只有 [".env*"]：
  修改 button.tsx       → 源码不在自定义范围内，可能复用旧结果
  修改 .env.production  → 文件输入发生变化，重新构建

inputs 为 ["$TURBO_DEFAULT$", ".env*"]：
  修改上述任一文件     → 文件输入发生变化，重新构建
```

这里举例只讨论文件输入；依赖任务、脚本、锁文件等也会影响缓存。因此“没写 `inputs`”不是关闭输入追踪，“写了 `inputs` 却没保留默认范围”才是需要特别留意的情况。

#### `outputs`

```json
"outputs": ["dist/**", "dist-app/**", "dist-lib/**"]
```

输出路径相对于执行任务的包目录。它告诉 Turbo 哪些生成文件应该保存到缓存，命中缓存时可以恢复这些文件。

**`outputs` 不会创建这些目录，也不会修改 Vite/Rollup 的输出设置。** 必须先由包内构建工具实际生成产物，再由 Turbo 缓存。

`outputs: []` 表示不保存文件产物，仍可以缓存成功执行的检查结果和日志。它与 `cache: false` 不同。

#### `cache` 与 `persistent`

开发服务采用：

```json
"cache": false,
"persistent": true
```

`cache: false` 每次都真正执行命令。`persistent: true` 表示命令长期运行，例如 Vite 开发服务器；不能把它当作等待结束的普通前置任务。

##### `cache` 决定能不能用旧结果替代本次执行

`cache` 默认是 `true`，所以构建、lint、typecheck 通常不用重复写 `cache: true`。

例如连续执行两次 ui-base 构建，且输入没有变化：

```text
cache: true（默认）：
  首次执行 → 调用构建命令，生成 dist-lib，保存结果
  再次执行 → 若命中缓存，恢复产物并显示日志，不再调用构建命令

cache: false：
  首次执行 → 调用构建命令
  再次执行 → 仍调用构建命令
```

开发服务需要真实启动一个正在运行的进程。恢复旧日志和文件无法恢复一个 Vite 服务器，因此 `dev` 禁用缓存。即使开发服务长期运行、不容易形成成功缓存记录，也应该显式表达“这个命令每次都必须启动”。

##### `persistent` 告诉调度器这个任务不会正常执行结束

`persistent` 默认是 `false`。构建命令通常生成产物后退出，后续任务可以等待它成功结束；Vite 开发服务则持续监听端口和文件，不会像构建一样主动退出。

标记 `persistent: true` 后，Turbo 知道这是长期任务，并会校验任务依赖，防止其他任务被配置为等待它结束。例如：

```text
合法的依赖：@workspace/utils#build → @workspace/demo#dev:dist
  utils 构建完成后退出，demo 再启动并长期运行。

不合法的依赖（假设如此配置）：next-app#dev（persistent）→ @workspace/demo#dev:dist
  demo 被要求等待 Next 开发服务结束，正常情况下永远等不到。
  Turbo 会针对这种依赖配置报错。
```

不写 `persistent` 并不会让 Vite 自动结束，也不会关闭 Vite 的热更新；只是 Turbo 没有得到正确的任务属性，无法按长期任务规则进行调度校验。它也不是让进程脱离终端、在后台永远运行的开关。

两者分别控制缓存复用和任务生命周期，不能互相替代。当前开发任务需要“每次真实启动”且“长期运行”，所以同时配置 `cache: false` 和 `persistent: true`。

以上字段的完整定义见 [Turbo 配置参考](https://turborepo.dev/docs/reference/configuration)。

### 各任务的配置与原因

本节与 `turbo.json` 保持相同的阅读顺序：先说明通用任务，再说明包专用任务。JSON 中的书写顺序只影响阅读，真正的执行顺序由 `dependsOn` 决定；包专用规则也不是靠“放在后面”才生效。

#### 通用 `build`

先执行依赖包的 `build`，跟踪默认输入和环境文件，缓存 `dist`、`dist-app`、`dist-lib` 三类常见输出。

本仓库的 Rollup 功能包和 Nest 学习项目使用 `dist`；ui-base/editor 的库使用 `dist-lib`，演示页面使用 `dist-app`。通用规则兼容这些目录，再通过专用配置精确描述特殊包。

#### `build:lib` 与 `build:app`

| 任务 | 前置任务 | 缓存目录 | 本项目用途 |
| --- | --- | --- | --- |
| `build:lib` | 依赖包的 build | `dist-lib/**` | editor 的库构建 |
| `build:app` | 依赖包的 build | `dist-app/**` | ui-base/editor 自己的演示页面 |

它们都显式跟踪环境文件。

ui-base 的 build 检查类型、通过 Vite lib 模式构建 ESM，再由 tsc 生成声明；editor 的 build:lib 检查类型并串行构建 ESM 和 UMD。这些包内步骤仍由包脚本控制，Turbo 编排的是外层任务。

虽然 editor 的 `build` 调用 `build:lib`，但 `turbo run build` 与 `turbo run build:lib` 是不同任务，不能认为二者自动共享同一个缓存记录。内部的 `pnpm run build:lib` 也不是一次独立的 Turbo 调度。

##### 同样的产物为什么会对应两个缓存记录

以 Editor 为例，它的包脚本是：

```json
"build": "pnpm run build:lib",
"build:lib": "tsc -b && vite build --config vite.lib.config.ts"
```

从包脚本看，两个入口最终都执行同样的库构建；但 Turbo 根据“包名 + 任务名”等信息识别任务，不会分析 shell 脚本并把两个入口自动合并。

```text
turbo run build --filter=@workspace/editor
  Turbo 调度：@workspace/editor#build
  实际命令：pnpm run build:lib → tsc 和 Vite
  缓存归属：@workspace/editor#build

turbo run build:lib --filter=@workspace/editor
  Turbo 调度：@workspace/editor#build:lib
  实际命令：tsc 和 Vite
  缓存归属：@workspace/editor#build:lib
```

假设开始时两个任务都没有缓存：

- 第一次执行 `turbo run build`，保存 `editor#build` 的缓存。
- 再次执行相同的 `turbo run build`，输入未变时可以命中该缓存。
- 改为执行 `turbo run build:lib`，需要查找另一个任务的缓存；即使前面的 `build` 已成功，也可能重新构建。
- 此后再次执行相同的 `turbo run build:lib`，才可以复用它自己已经保存的缓存。

`outputs` 都写 `dist-lib/**`，只表示两个任务保存相同目录，不表示它们使用同一个缓存标识。构建工具自身可能另有增量优化，但这是另一层机制。

当前保留两个脚本是为了提供全仓库统一的 `build` 入口，以及包内明确的 `build:lib` 入口；日常通过同一类 Turbo 入口执行即可。`build:app` 还会运行演示页面构建，产物和用途都与库构建不同。

#### 通用 `dev`

禁用缓存，声明为长期任务。当前没有通用 `^build` 前置依赖。

因此 `pnpm dev:admin` 和 `pnpm dev:next` 主要启动所选应用，不会自动启动所有库的 watch 服务，也不会统一先构建所有库。

源码组件的热更新由 Vite/Next 的解析和文件监听机制负责。是否需要预构建，应根据实际导入的是源码还是产物判断。

#### `lint`

```json
"dependsOn": ["^lint"],
"outputs": []
```

先检查依赖包，再检查当前包；结果不保存文件产物。ESLint 真正的规则来自各包的配置和共享配置包。

这种先后顺序是一种一致性约束，lint 通常不必读取依赖包构建产物。当前规则并未要求先执行 `build`。

#### `typecheck`

```json
"dependsOn": ["^build"],
"outputs": []
```

先生成依赖库的构建产物，确保依赖库导出的类型声明可用，再检查当前包。这里是依赖包的构建，并非先构建当前包自己。

对读取构建入口的消费者，这是必要保障；对使用源码别名的应用，则是较保守的统一策略，可能产生额外构建工作。

**当前 Next 的 typecheck 还有一个实际边界：** 它执行 `next typegen && tsc --noEmit`，会生成 `.next/types` 等类型文件，但通用任务配置的 `outputs: []` 不会保存这些文件。缓存命中时不会重新执行 `next typegen`，也不会恢复它的生成文件。不能把 `outputs: []` 理解为所有检查脚本绝对不写文件。

#### `@workspace/editor#build`

editor 的专用构建任务将输出限定为：

```json
"outputs": ["dist-lib/**"]
```

因为 editor 当前的 `build` 只调用 `build:lib`。执行全仓库构建时，库产物会生成，演示页面由单独入口构建。ui-base 没有专用 build 任务，使用通用 build 规则，库产物同样位于 dist-lib。

这样 editor 的库构建不会把之前残留的 `dist-app` 当作本次结果一起缓存。它也让发布所需构建与演示页面构建职责明确。

#### `next-app#build`

```json
"outputs": [".next/**", "!.next/cache/**", "!.next/dev/**"]
```

Next 的构建结果在 `.next`，因此不能只用通用 `dist` 规则。

- `.next/**`：保存 Next 构建产物。
- `!.next/cache/**`：排除 Next 自己的编译缓存，避免把它作为交付产物重复打包进任务缓存。
- `!.next/dev/**`：排除开发服务生成的内容。

`!` 表示从前面的匹配范围中排除。此任务仍先构建 Next 依赖的工作区库，并跟踪环境文件。

#### demo 的 `dev` 与 `dev:dist`

两者都是长期任务、不缓存，而且增加 `^build` 前置依赖。

demo 用于模拟使用库产物，当前依赖 utils。第一次启动前需要 utils 的产物就绪，所以不能完全照搬通用 `dev`。

**这只保证启动时完成依赖构建。** demo 启动后修改 utils 源码，当前命令不会自动重建该库。需要重新执行库构建，或未来另行设计库的 watch 流程。

#### demo 的 `build:dist`

先构建依赖库，再构建 demo，缓存其 `dist/**`。

当前这个专用任务没有显式配置 `inputs`，使用默认文件输入；它不会自动继承通用 `build` 的 `.env*` 配置，因为 `build:dist` 是另一个任务名称。若以后 demo 的产物依赖被忽略的环境文件，需要单独考虑该任务的输入。

##### 为什么 demo 有三个专用配置

专用配置的数量由“哪些任务偏离通用规则”决定，不是每个应用必须配置一个，也不是 demo 启动时会连续运行这三个任务。

demo 当前提供这些脚本：

```json
"dev": "vite --mode dist",
"dev:dist": "vite --mode dist",
"build": "vite build --mode dist",
"build:dist": "vite build --mode dist"
```

`dev` 与 `dev:dist` 是两种名称的开发入口，`build` 与 `build:dist` 是两种名称的构建入口。脚本内容相同，并不会让 Turbo 把不同任务名称自动视为同一个任务。

| demo 任务 | 是否需要专用配置 | 原因 |
| --- | --- | --- |
| `dev` | 需要 | 通用 dev 没有前置构建，demo 读产物，需要增加 `^build` |
| `dev:dist` | 需要 | 它是另一个任务名，不会自动获得 dev 的规则，也需要前置构建和长期任务属性 |
| `build` | 无需另写 | 通用 build 已有 `^build` 和 `dist/**` 输出，能覆盖当前需求 |
| `build:dist` | 需要 | 它是另一个任务名，需要单独声明前置构建和 `dist/**` 输出 |

所以现在看到三个 demo 专用配置，但执行 `pnpm dev:demo` 时，只选择 `demo#dev:dist` 及其前置构建；不会同时再执行 `demo#dev` 和 `demo#build:dist`。

其他应用使用通用规则已经覆盖的大部分任务。react-vite-admin 当前没有包专用配置；Next 仅因构建目录是 `.next`，单独配置 `next-app#build`，其 dev、lint、typecheck 仍使用通用规则。

如果未来去掉重复入口，专用配置数量可以随之减少。这属于脚本入口设计的调整，当前为保留现有命令而继续分别声明。

### 根目录命令的使用方式

以下是当前根 `package.json` 中的入口。这里只说明命令，不代表本文已经执行过构建。

| 命令 | 范围与作用 |
| --- | --- |
| `pnpm build` | 全工作区的 build 任务 |
| `pnpm build:all` | 与 `pnpm build` 相同 |
| `pnpm build:packages` | 选择 `packages/*` 下的包执行 build |
| `pnpm build:apps` | 选择 `apps/**` 下的应用执行 build |
| `pnpm build:package-apps` | 单独构建 ui-base/editor 的演示页面 |
| `pnpm lint` | 全工作区 lint |
| `pnpm lint:packages` | 选择 packages 下的包执行 lint |
| `pnpm lint:root` | 直接运行根 ESLint，递归扫描仓库，不经过 Turbo |
| `pnpm typecheck` | 全工作区类型检查，并执行配置要求的依赖构建 |
| `pnpm typecheck:packages` | 选择 packages 下的包执行类型检查 |
| `pnpm dev` / `pnpm dev:admin` | 启动 react-vite-admin |
| `pnpm dev:next` | 启动 Next 应用 |
| `pnpm dev:demo` / `pnpm dev:demo:dist` | 先构建依赖，再启动产物模式 demo |
| `pnpm build:demo:dist` | 构建产物模式 demo 及其前置依赖 |

`--filter` 选择任务的目标包，但目标的前置任务仍会执行。例如 `build:apps` 可以触发应用所依赖的 `packages` 构建，并非禁止访问 packages。

`lint:root` 是直接执行工具的补充入口，不是 Turbo 任务。根 ESLint 10 会从每个文件所在目录向上寻找配置，子项目采用自己的配置，没有独立配置的目录使用根 eslint.config.js 兜底；它也可覆盖根目录文件。通用 `pnpm lint` 则只编排工作区包的 lint 脚本。

多个 `--filter` 可以选择多个目标，因此演示页面命令同时选择 ui-base 和 editor。手动在终端输入带通配符的过滤条件时，建议加引号，避免 shell 提前展开：

```sh
pnpm exec turbo run build --filter='./packages/*'
```

参考：[运行任务与过滤](https://turborepo.dev/docs/crafting-your-repository/running-tasks)。

#### 根命令与包内直接执行的区别

```sh
# 经过 Turbo：处理前置任务，并尝试复用缓存。
pnpm exec turbo run build --filter=@workspace/ui-base

# 直接执行 ui-base 的脚本：不经过 Turbo 的任务编排与缓存。
pnpm --filter @workspace/ui-base build
```

根 `package.json` 的 `build` 是入口，Turbo 查找工作区包的同名脚本，不会简单地再次递归调用这个根入口。

#### `prepack` 与 Turbo 的关系

editor 当前配置为：

```json
"build": "pnpm run build:lib",
"prepack": "pnpm run build:lib"
```

前者是主动构建入口，后者是打包发布相关生命周期入口，保证打包前生成库产物。命令内容相同是为了覆盖不同触发场景。

`prepack` 由包管理器的生命周期触发；执行 `turbo run build` 不意味着 Turbo 会额外自动执行一次 `prepack`。当前 `prepack` 内部直接调用 pnpm，不利用 Turbo 的任务缓存。

### 本项目的缓存行为

在输入、配置及依赖任务等相关条件一致时，Turbo 可以复用成功任务的结果：恢复已声明的输出文件，并回放日志，而不用再次调用构建命令。

本项目没有配置 `cacheDir`，本地缓存默认位于 `.turbo/cache`。仓库 `.gitignore` 已忽略 `.turbo`。配置中未声明远程缓存，本文以本地缓存为主；仅凭仓库文件不能判断当前机器是否另行完成了远程缓存认证。[缓存说明](https://turborepo.dev/docs/crafting-your-repository/caching)

例如 ui-base 构建完成后，只删除 `dist-lib`，保留缓存且输入没有变化，后续通过 Turbo 构建可以恢复产物。若输入变化或没有可用缓存，则真正执行构建。

几种缓存要区分：

| 缓存或目录 | 管理者 | 用途 |
| --- | --- | --- |
| `.turbo/cache` | Turbo | 任务结果与声明的文件产物 |
| pnpm store | pnpm | 安装依赖时复用包内容 |
| `.next/cache` | Next | Next 自身的编译缓存 |
| Vite 的依赖预构建缓存 | Vite | 开发启动和依赖转换 |
| `dist` / `dist-lib` / `dist-app` | 各构建工具 | 实际生成的构建产物 |

清理其中一个不代表其他缓存也清空。`--force` 要求 Turbo 重新执行任务，但不等于清理 Next、Vite 等工具自己的内部缓存。

#### 环境变量的边界

当前 build、build:lib、build:app 及包专用 build 规则通过 `.env*` 跟踪文件变化；demo 的 build:dist 未显式补充该输入。仓库没有显式声明 `env`、`globalEnv` 或 `passThroughEnv`。

Turbo 默认采用严格环境变量模式，并有框架推断机制。若以后通过 CI 或终端注入变量，需要同时考虑变量是否传入任务，以及变量变化是否影响缓存标识。对影响产物的变量应使用合适的 `env` / `globalEnv` 配置；仅透传变量不等于把变量值计入缓存。

不能认为添加 `.env*` 后，任何环境变量变化都已经被缓存正确追踪。[环境变量说明](https://turborepo.dev/docs/crafting-your-repository/using-environment-variables)

### 查看任务与排查问题

下面命令供需要时手动执行，不是修改项目配置的必要步骤。

```sh
# 查看 ui-base 构建将执行什么，以及缓存相关信息；不真正构建。
pnpm exec turbo run build --filter=@workspace/ui-base --dry=json

# 查看 Next 的构建计划与依赖任务。
pnpm exec turbo run build --filter=next-app --dry=json

# 输出 demo 构建的任务关系图。
pnpm exec turbo run build --filter=@workspace/demo --graph

# 强制重新执行 ui-base 构建及所需前置任务。
pnpm exec turbo run build --filter=@workspace/ui-base --force
```

排查时先确定以下几件事：

- 当前命令是否经过 Turbo，还是直接执行了包脚本。
- 包的 `name` 与专用任务配置、过滤条件是否一致。
- 依赖是否在 `package.json` 中声明，前置任务是否正确。
- 实际输出目录是否与 `outputs` 一致。
- 影响产物的文件和环境变量是否进入缓存输入。
- 日志显示的是实际执行还是缓存命中；回放日志不代表命令再次运行。

### 当前设计的范围与后续扩展

当前方案已经统一了构建、检查和开发入口，并保留各包独立配置。使用时仍需记住：

- 全量 `build` 不包含 ui-base/editor 的演示页面，需要单独执行 `build:package-apps`。
- demo 的依赖构建是启动前执行一次，不持续监听上游源码。
- Next 的类型生成文件目前未纳入 typecheck 文件缓存。
- `build:dist` 与通用 `build` 的输入规则并不完全相同。
- 全局共享配置变化会保守地影响所有任务缓存。
- 源码别名、CSS 的源码导出、组件热更新仍由应用与包的配置负责。

后续若增加 CI、远程缓存、依赖库 watch 或环境变量配置，应根据实际需求逐项扩展。新增包时，通常先维护包名、工作区依赖和脚本；只有任务输出或执行规则与通用配置不同，才需要增加包专用 Turbo 配置。
