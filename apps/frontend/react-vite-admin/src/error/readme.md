| 场景/需求                           | React 原生 ErrorBoundary                     | react-error-boundary                       |
| ----------------------------------- | -------------------------------------------- | ------------------------------------------ |
| 页面 render 崩溃后显示降级 UI       | 需要自己维护 `hasError` 和 `render fallback` | 直接通过 `FallbackComponent` 渲染错误 UI   |
| 用户点击“重试”恢复页面              | 需要自己写 `setState({ hasError: false })`   | fallback 内直接调用 `resetErrorBoundary()` |
| 路由切换后自动恢复错误页面          | 需要在 `componentDidUpdate` 手动比较路由参数 | `resetKeys={[pathname]}` 自动恢复          |
| tab 切换后重新渲染错误区域          | 手动监听 props/state 变化并 reset            | `resetKeys={[activeTab]}` 自动 reset       |
| 在函数组件中定义 Boundary           | 必须额外写 class 组件                        | 直接 `<ErrorBoundary>` 使用                |
| async/await 错误进入 Boundary       | 需要自己设计错误桥接机制                     | `showBoundary(error)` 直接转交 Boundary    |
| fetch 请求失败后显示 fallback 页面  | 需要自己维护 error state + 条件渲染          | catch 后直接 `showBoundary(error)`         |
| 在 fallback 中拿到错误对象          | 需要自己从 state 传 props                    | 自动注入 `error`                           |
| 在 fallback 中触发恢复              | 需要自己传 reset 方法                        | 自动注入 `resetErrorBoundary`              |
| 多个页面共用同一个错误 UI           | 需要手动统一封装 class                       | 直接复用 `FallbackComponent`               |
| 给图表区域单独做错误隔离            | 需要单独写 Boundary 类                       | 直接包一层 `<ErrorBoundary>`               |
| 微前端子应用崩溃隔离                | 需要重复写多个 Boundary 类                   | 可以快速包裹多个子树                       |
| React.lazy chunk 加载失败后重试     | 需要自己实现 retry 逻辑                      | fallback 中直接 reset + reload             |
| Suspense loading + error 分离       | 需要自己组织结构                             | 官方推荐组合方式更自然                     |
| TypeScript 中定义 fallback props    | 需要手动声明 error/reset 类型                | 内置 `FallbackProps`                       |
| 页面多个 widget 独立恢复            | 需要每个 widget 单独写 class                 | 每个 widget 单独包 `<ErrorBoundary>` 即可  |
| Promise 错误统一进入 React 错误体系 | React 本身没有对应 API                       | `showBoundary` 专门解决                    |
| 动态切换用户后恢复错误状态          | 需要手动监听 userId                          | `resetKeys={[userId]}`                     |
| 错误恢复后重新挂载 subtree          | 需要自己控制 state 和 key                    | `resetBoundary()` 内置支持                 |
| 快速给已有函数组件增加错误边界      | 需要新增 class 文件                          | 直接 JSX 包裹即可                          |