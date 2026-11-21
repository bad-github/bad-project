## 前提

只有启用了 Suspense 的数据源才会激活 Suspense 组件，包括

- 支持 Suspense 的框架如 Relay 和 Next.js
- 使用 lazy 懒加载组件代码
- 使用 use 读取缓存的 Promise 值
- 一些三方请求库，如React Query

原理：suspense  不是“监听异步”而是 “捕获 render 期间抛出的 Promise”，这个组件在 render 时，会不会等一个 Promise

```tsx
function Albums() {
  const promise = fetchData();

  if (!promise.done) {
    throw promise; // 核心
  }

  return <div>...</div>;
}
```



## lazy

参数：一个返回 [Promise](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise) 或另一个 **thenable**（具有 `then` 方法的类 Promise 对象）的函数。

-  React 首次调用 `load` 后，它将等待其解析，然后将解析值的 `.default` 渲染为 React 组件。
- React 不会在你尝试首次渲染返回的组件之前调用 `load` 函数
- 返回的 Promise 和 Promise 的解析值都将被缓存，因此 React 不会多次调用 `load` 函数。如果 Promise 被拒绝，则 React 将抛出拒绝原因给最近的错误边界处理

返回值

返回一个 React 组件，你可以在 fiber 树中渲染。当懒加载组件的代码仍在加载时，尝试渲染它将会处于 *暂停* 状态。使用 [``](https://zh-hans.react.dev/reference/react/Suspense) 可以在其加载时显示一个正在加载的提示

