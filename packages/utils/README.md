# 工具分类

统一使用领域对象调用，方法名保持原有含义；不再从包根导出零散函数，也不再维护 `common.ts`。

| 文件 / 对象 | 职责 | 示例 |
| --- | --- | --- |
| `file` | 上传进度、下载、文件大小 | `file.formatByteSize(1024)` |
| `tree` | 搜索、筛选、生成、路径查找 | `tree.findNodePath(id, nodes)` |
| `time` | 延迟返回、时间转换、日期和纳秒格式化 | `time.sleep(data, 1000, 0.99)` |
| `number` | 数值判断、数值格式化、随机整数 | `number.isNumeric(value)` |
| `text` | 文本宽度、字符处理、复制 | `text.copyText(value)` |
| `browser` | 能力检测、DOM 属性、按帧调度 | `browser.canIUse('BroadcastChannel')` |
| `color` | 颜色生成与处理 | `color.randomColor('hex')` |
| `regex` | 校验表达式与无状态匹配 | `regex.test(regex.IPv4, value)` |
| `shortcut` | 按平台获取快捷键与显示文本 | `shortcut.getHotkey('globalSearch')` |

```ts
import {file, tree, time, number, text, browser, color, regex, shortcut} from '@workspace/utils';

file.isFileSizeInRange(selectedFile.size, 1024 ** 3);
file.downloadFile(buffer, 'report.csv', {type: 'text/csv;charset=utf-8;'});
```

所有类型统一在 `src/types.ts` 中定义，按领域分组；`TreeNode`、`TimeUnit`、`UploadProgressOptions` 等类型统一从包根通过 `import type` 导入。
树的默认字段配置通过 `tree.defaultConfig` 访问；`ShortcutProvider` 保留供需要独立实例的场景使用。
以后新增方法应放入对应领域文件，并加入该文件导出的对象。新增领域时再在 `src/index.ts` 注册导出。

## 能力检测

```ts
import {browser} from '@workspace/utils';

browser.canIUse('window');
browser.canIUse('BroadcastChannel');
browser.canIUse('navigator.clipboard.writeText');
browser.canIUse('BroadcastChannel', iframe.contentWindow); // 可指定检测对象
```

按实际环境检测属性路径，不依赖浏览器版本；SSR、缺失路径和抛错的 getter 均安全返回 `false`。
它不调用 API，也不验证权限、配额或操作结果；返回 `true` 后，实际使用时仍需处理异常。
`false`、`0` 和空字符串属于已存在的属性值，不会被误判为不支持。

运行测试：`pnpm --filter @workspace/utils test`。

## 延迟返回数据

```ts
import {time} from '@workspace/utils';

await time.sleep({id: 1}, 2000, 0.99);
await time.sleep(undefined, 2000); // 仅等待时，时间仍传第二个参数
```

`time.sleep(data, time = 1000, rate = 0.99)` 保持按概率成功或失败的行为，成功和失败都携带原始 `data`。
返回类型根据 `data` 推断，显式指定的泛型必须与数据一致。

## 时间格式化

相关方法在 `src/time.ts` 实现，通过 `import {time} from '@workspace/utils'` 使用。

- `formatRelativeDate`：过去时间按分钟、小时或天返回；未来时间返回完整 `Date`；无效输入返回 `unit: 'invalid'`。
- `formatNsFromDuration` / `formatNsFromTimestamp`：先使用 `BigInt` 舍入，再拆分单位，保留纳秒精度并处理进位。
- 纳秒参数较大时传字符串或 `bigint`，不接受已经丢失精度的不安全 `number`。
- `fractionDigits` 支持 0–100，超过九位的部分补零；时间戳的日期与时钟使用运行环境本地时区。

## 文件操作 API

`file` 提供 `uploadProgress`、`downloadFile`、`isFileSizeInRange` 和 `formatByteSize`。

```ts
import {file} from '@workspace/utils';

const controller = new AbortController();
await file.uploadProgress({
  total: selectedFile.size,
  duration: 2000,
  interval: 100,
  initialLoaded: 0,
  signal: controller.signal,
  onProgress: (event) => {
    const percent = event.total === 0 ? 100 : (event.loaded / event.total) * 100;
    console.log(percent);
  },
});
// 完成后再返回模拟接口结果；失败响应也由业务方决定。
```

此工具在浏览器中使用，不发送请求。`duration` 表示从 `initialLoaded` 到 `total` 的耗时（毫秒），
`interval` 是期望回调间隔，实际调度受浏览器影响。进度按经过时间计算，最后一次精确到 `total`。
`duration: 0`、空文件或已经完成时立即报告完成。调用 `controller.abort()` 会停止进度，
并以 `AbortError` 拒绝 Promise；提前中断的信号不会触发回调。完成、中断和回调异常时均清理计时器及监听。

## 打包

### 安装依赖

pnpm add
- rollup: 打包器核心引擎，负责将代码打包成各种模块规范
- @rollup/plugin-node-resolve: 让 Rollup 能够定位并处理 node_modules 中的第三方依赖
- @rollup/plugin-commonjs: 将某些只提供 CommonJS 的依赖转换为 ESM，以便 Rollup 处理
- @rollup/plugin-typescript: 集成 TypeScript 编译器，负责把 .ts 转换成 .js
- rollup-plugin-dts: 可以把零散的 TS 类型声明文件，像打包 JS 一样合并成一个干净整洁的 index.d.ts
- tslib: 包含 TS 编译输出所需的辅助函数，避免在每个文件里重复注入，减小打包体积

### package.json

script

--configPlugin typescript 告诉 Rollup 的命令行工具（CLI）：“在读取并执行配置本文件之前，请先用 @rollup/plugin-typescript 这个插件把 rollup.config.ts 即时编译成 JS。”


