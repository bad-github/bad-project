# 测试知识与项目约定

本文先记录 Vitest 的基础事实、仓库接入方式与常用命令。组件测试、交互测试和端到端测试目前作为后续扩展方向，尚未接入本文介绍的新增工具链。

命令默认在仓库根目录执行，项目现状核对日期为 2026-10-20。

## Vitest 是什么

Vitest 是基于 Vite 的测试框架，负责发现用例、运行代码、执行断言和报告结果。它可以用于普通 JavaScript / TypeScript 工具包，使用方不必是 Vite 应用，但会引入 Vite 相关依赖。[官方入门](https://vitest.dev/guide/)

几个需要区分的概念：

| 概念       | 作用                                                   |
| ---------- | ------------------------------------------------------ |
| 测试运行器 | 发现、调度用例，输出成功与失败结果                     |
| 断言       | 判断实际结果是否符合预期，例如 `expect(value).toBe(1)` |
| Mock       | 用可控制的替身替换函数或模块，验证异常、调用参数等行为 |
| 测试环境   | 提供 Node、模拟 DOM 或真实浏览器等运行条件             |
| 覆盖率     | 统计测试执行过的代码范围，辅助寻找遗漏                 |

Vitest 提供断言、Mock、模拟计时器、快照等配套功能；浏览器和覆盖率等功能可能需要额外安装依赖。`node:test` 同样能完成很多测试任务，是否迁移取决于需求与维护成本，使用 Vitest 不是测试正确性的前提。

### 安装位置、版本与配置各管什么

Vitest 通常作为使用方的开发依赖，无需全局安装。本项目将以下职责分开：

| 位置                                    | 职责                                   |
| --------------------------------------- | -------------------------------------- |
| 根 `pnpm-workspace.yaml` 的 `overrides` | 将 Vitest 版本范围统一为 `^5.0.5`      |
| 子模块的 `devDependencies`              | 声明该模块使用 `vitest` 和共享配置包   |
| `tooling/vitest-config`                 | 共享运行环境与测试文件匹配规则         |
| 子模块的 `scripts.test`                 | 定义该模块如何准备并运行测试           |
| `pnpm-lock.yaml`                        | 记录具体依赖版本、依赖关系及工作区链接 |

`overrides` 不会自动给模块安装 Vitest；公共配置也不会自动给模块添加测试命令。pnpm 将依赖存放在根 `node_modules/.pnpm` 中，不代表根工程声明了该依赖。

### 支持 TypeScript 不等于完成类型检查

Vitest 可以转换并运行 TypeScript，但普通 `vitest run` 不会自动完成项目的静态类型检查。本项目继续单独运行 `typecheck`；是否检查测试文件，还取决于对应 tsconfig 的 `include`。类型断言测试可以后续使用 `expectTypeOf` 等能力单独配置。[类型测试说明](https://vitest.dev/guide/testing-types.html)

## 当前仓库的测试现状

| 模块                 | 运行器              | 测试目标                                                          | 执行准备                      |
| -------------------- | ------------------- | ----------------------------------------------------------------- | ----------------------------- |
| `react-vite-admin`   | Vitest              | 表单规则、异步校验、模拟接口、树操作、状态仓库                    | 部分测试消费 `utils` 构建产物 |
| `@workspace/editor`  | Vitest              | 扩展依赖合并、去重、冲突与默认扩展替换                            | 直接导入源码                  |
| `@workspace/ui-base` | Vitest              | 组件 SSR 输出、主题上下文、Storybook 主题初始化                   | `test` 脚本先构建，再测试产物 |
| `@workspace/utils`   | Node.js `node:test` | `browser`、`file`、`tree`、`time`、`regex`、`shortcut` 的边界行为 | 直接导入源码                  |
| `@workspace/supabase` | Node.js `node:test` | 离线 SDK 请求、分页、文件操作、订阅清理和公共类型 | `test` 脚本先构建，再检查声明和测试产物 |
| `@workspace/mock` | Node.js `node:test` | 种子复现、实例隔离、语言加载、数据一致性、稳定分页和公共类型 | `test` 脚本先构建，再检查声明和测试产物 |

三个 Vitest 使用方都引用 `@workspace/vitest-config/base.js`。现有 `node:assert/strict` 断言保留；它可以与 Vitest 配合使用，无须全部改写为 `expect`。

测试名称不能单独决定测试层级。调用多个真实依赖共同验证行为的用例可能属于集成测试；React 服务端渲染测试能检查 HTML 和 SSR 安全性，但不能证明点击、输入、浏览器布局或挂载后的效果正确。

当前根目录尚未提供统一 `test` 脚本，Turbo 尚未配置 `test` 任务，仓库中也尚未发现 CI 配置文件。引入 Vitest 不会自动完成这些接入。

## 公共配置工程

共享包位于 `tooling/vitest-config`，通过 JavaScript 和配套类型声明直接导出配置，无需构建。

当前 `base.js`：

```js
import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx,js,jsx,mjs}', 'tests/**/*.test.{ts,tsx,js,jsx,mjs}'],
  },
});
```

这里的规则相对于使用方的项目根目录匹配。当前只匹配 `src/`、`tests/` 下指定后缀的 `.test.` 文件，没有包含 `.spec.` 文件；这是本项目规则，不是 Vitest 能力限制。

子模块无需额外设置时，`vitest.config.ts` 直接转发：

```ts
export {default} from '@workspace/vitest-config/base.js';
```

需要增加模块名称或调整环境时，可以合并配置：

```ts
import baseConfig from '@workspace/vitest-config/base.js';
import {defineConfig, mergeConfig} from 'vitest/config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: 'my-package',
    },
  })
);
```

Vitest 可以读取 Vite 配置，但独立的 `vitest.config.ts` 优先，不会自动与 `vite.config.ts` 合并。因此，应用中的源码别名、React 插件等需要显式配置或合并；共享基础配置没有包含它们。[配置说明](https://vitest.dev/config/)

## 常用命令

```bash
# 单次运行各模块测试
pnpm --filter react-vite-admin test
pnpm --filter @workspace/editor test
pnpm --filter @workspace/ui-base test
pnpm --filter @workspace/utils test

# admin 测试需要 utils 产物；首次运行或修改 utils 后可先构建
pnpm --filter @workspace/utils build

# admin 和 editor 提供监听模式
pnpm --filter react-vite-admin test:watch
pnpm --filter @workspace/editor test:watch

# 按文件、用例名称筛选 editor 测试
pnpm --filter @workspace/editor test tests/resolve-editor-extensions.test.ts
pnpm --filter @workspace/editor test -t '同名不同配置'
```

`vitest run` 单次执行后退出；`vitest` 在交互式开发环境中默认监听变化。当前 `ui-base` 没有 `test:watch` 脚本；直接运行它的 Vitest 只会测试已有构建产物，修改源码后需要重新构建。

## 用例的基本写法

下面是可放入 `.test.ts` 文件的独立示例。`describe` 用来组织用例，`test` 定义行为，`expect` 判断结果。

```ts
import {describe, expect, test} from 'vitest';

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

describe('邮箱规范化', () => {
  test.each([
    [' Alice@Example.COM ', 'alice@example.com'],
    ['', ''],
  ])('将 %j 规范化为 %j', (input, expected) => {
    expect(normalizeEmail(input)).toBe(expected);
  });
});
```

`toBe` 适合比较原始值或引用；`toEqual` 适合比较对象与数组的结构。异步用例应当 `await` 或返回 Promise，确保断言在用例结束前完成。

### Mock 与模拟计时器

`vi.fn()` 创建可观察调用的函数；`vi.spyOn()` 监听已有方法；`vi.mock()` 替换模块。只替换当前测试不打算验证的外部边界，保留要验证的业务逻辑。模块 Mock 涉及提升与导入顺序，不能简单按普通赋值语句理解。[Mock 说明](https://vitest.dev/guide/mocking.html)

防抖、节流、超时和延迟响应可以使用模拟计时器，避免真实等待。模拟完成后恢复环境，避免影响后续用例：

```ts
import {afterEach, expect, test, vi} from 'vitest';

afterEach(() => {
  vi.useRealTimers();
});

test('延迟任务到期后执行', async () => {
  vi.useFakeTimers();
  const save = vi.fn();
  setTimeout(save, 1000);

  expect(save).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1000);
  expect(save).toHaveBeenCalledTimes(1);
});
```

## 运行环境与覆盖率

`node` 环境适合纯逻辑和服务端测试，不提供浏览器 DOM。`jsdom`、`happy-dom` 提供模拟 DOM，需要另装相应依赖；它们不能完整还原浏览器布局和渲染。Vitest Browser Mode 在真实浏览器里运行测试，需要额外配置，不能等同于完整应用的 E2E 测试。[环境说明](https://vitest.dev/guide/environment.html)

覆盖率可通过 V8 或 Istanbul 提供器收集，需要安装对应工具并配置统计范围。当前项目尚未接入覆盖率。未来应同时关注关键业务分支和异常路径，覆盖率数值本身不能证明断言正确。[覆盖率说明](https://vitest.dev/guide/coverage.html)

## 后续扩展：组件测试与交互测试

“组件测试”描述测试对象，“交互测试”描述测试行为，两者会重叠。例如：渲染分页组件后点击下一页，并检查回调与可见页码，这既是组件测试，也是交互测试。

| 测试范围            | 示例                                 | 可选工具路线                                  |
| ------------------- | ------------------------------------ | --------------------------------------------- |
| 纯逻辑              | 表单校验、树节点删除、数据转换       | 当前 Vitest 或 `node:test`                    |
| React 组件与交互    | 输入、点击、键盘操作后检查可见结果   | Vitest + React Testing Library + 模拟 DOM     |
| 真实浏览器组件行为  | 依赖尺寸、焦点、滚动等浏览器能力     | Vitest Browser Mode + 对应 React 渲染适配工具 |
| 完整业务流程（E2E） | 打开应用、登录、填表、保存后重新加载 | Playwright Test + 可运行的应用和所需服务      |

模拟 DOM 路线通常需要 `@testing-library/react`、其 peer dependency `@testing-library/dom`、用于模拟操作的 `@testing-library/user-event`，以及 `jsdom`；可选 `@testing-library/jest-dom` 增加 DOM 断言，其名称不表示必须安装 Jest。测试应通过角色、标签和用户可见结果验证行为。[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

真实浏览器组件测试可单独评估 Vitest Browser Mode，按届时所需版本选择提供器和渲染工具，避免与模拟 DOM 路线混用配置。[Vitest 组件测试](https://vitest.dev/guide/browser/component-testing.html)

E2E 可以使用 `@playwright/test`，并安装对应浏览器。它有自己的运行器，不依赖 Vitest；若请求被 Mock，验证的是前端流程，不能据此证明真实后端和数据库协作正确。[Playwright 入门](https://playwright.dev/docs/intro)

后续引入时，优先覆盖表单错误展示、动态字段增删、上传与删除、分页和主题切换等关键交互。届时再为 DOM、Browser Mode 或 E2E 建立独立配置，保留当前 Node 基础配置供逻辑测试使用。
