- useSubscription：用于直接订阅一个 GraphQL Subscription，组件每次推送时自动响应。适合只依赖订阅数据的场景
- subscribeToMore：是 useQuery 返回的方法之一，用于在已有 query 的基础上追加订阅逻辑，并且手动控制如何合并数据（通过 updateQuery）。适合有主列表页、数据增量更新的场景

| **对比点**  | useSubscription                | subscribeToMore                                 |
| ----------- | ------------------------------ | ----------------------------------------------- |
| 📦 所属钩子 | 独立使用（单独订阅）           | 属于 useQuery                                   |
| 🔁 数据合并 | 自动响应 data 变化             | 手动合并订阅数据到已有 query（via updateQuery） |
| 🔄 状态更新 | Apollo 自动处理订阅的结果      | 你必须手动返回合并后的结果                      |
| 💡 用例适配 | 简单推送、弹窗提示、聊天通知等 | 列表页追加数据、评论区追加新评论等              |
| 💥 错误处理 | 有独立的 error 状态            | 没有额外 error，必须靠 query 本身               |
