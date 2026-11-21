| 方案             | 通信范围                                     | 是否跨 Tab | 是否跨 iframe                                                | 是否跨框架 | 典型场景         |
| ---------------- | -------------------------------------------- | ---------- | ------------------------------------------------------------ | ---------- | ---------------- |
| CustomEvent      | DOM 树，属于DOM内部传播                      | ❌          | ❌（ifame 都不是同一个 document，甚至不是同一个 JS Runtime，Shadow DOM 只是DOM 子树隔离，他的JS Runtime 共享、Event Loop 共享、Window 共享、Document 共享） | ✅          | 组件通信、微前端 |
| EventBus         | JS Runtime                                   | ❌          | ❌                                                            | ✅          | 全局事件中心     |
| BroadcastChannel | 同源浏览器上下文                             | ✅          | ✅                                                            | ✅          | 多 Tab 同步      |
| postMessage      | Window/iframe，属于浏览器进程通信机制（IPC） | ✅          | ✅                                                            | ✅          | iframe 通信      |
| WebSocket        | 客户端 ↔ 服务端                              | ✅          | ✅                                                            | ✅          | 实时广播         |
| Redux/Zustand    | 应用状态树                                   | ❌          | ❌                                                            | 部分       | 状态广播         |
| RxJS Subject     | Observable 流                                | ❌          | ❌                                                            | ✅          | 响应式架构       |
| Service Worker   | 浏览器级                                     | ✅          | ✅                                                            | ✅          | 离线/推送        |
| SharedWorker     | 同源多个页面                                 | ✅          | ❌                                                            | ✅          | 多 Tab 共享      |
| Storage Event    | localStorage                                 | ✅          | ❌                                                            | ✅          | 登录同步         |

可以把前端通信分成 4 层

┌──────────────────────────────┐
│        4. 跨设备 / 服务端      │
│   WebSocket / HTTP / SSE      │
└──────────────────────────────┘
               ↑
┌──────────────────────────────┐
│        3. 浏览器上下文级       │
│ BroadcastChannel / postMessage│
│ storage event / SharedWorker   │
└──────────────────────────────┘
               ↑
┌──────────────────────────────┐
│        2. 页面 DOM 级          │
│ CustomEvent / DOM Event        │
└──────────────────────────────┘
               ↑
┌──────────────────────────────┐
│        1. JS 内存级（进程内）  │
│ mitt / EventBus / Redux        │
└──────────────────────────────┘



可以把现代前端理解成一句话：UI 不是自己动的，它一定是被某种“驱动源”推着变化的

有三种驱动源

- 状态驱动，UI = f(state)：状态变了 → 重新计算 UI
  - React / Vue / Redux / Zustand
- 事件驱动：发生了一件事，大家自己响应
  - mitt / CustomEvent / DOM Event / EventEmitter
- 运行时驱动：UI 更新不是直接发生，而是由“运行机制”（进入调度系统，排队执行）调度的
  - React：setState → scheduler → fiber → commit
  - 浏览器：click → event loop → task queue → handler
  - setTimeout：timer → macrotask → execution