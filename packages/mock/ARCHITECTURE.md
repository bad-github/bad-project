# 业务模块与公共集合

每个业务使用一个工厂函数，直接实现生成规则和专属方法。公共查询通过函数组合复用，不使用类、继承或依赖注入容器。

```text
src/
├── create.ts              # 创建独立 Faker，组装业务模块
├── index.ts
├── locales.ts
├── modules/
│   ├── user.ts            # 统一用户记录、列表和树
│   ├── notification.ts
│   ├── sort-item.ts
│   └── address.ts
├── common/
│   ├── collection.ts      # 按 count 缓存集合，组合通用方法
│   ├── dataset.ts         # 快照、筛选、排序、分页和范围
│   ├── define-entity.ts   # 自定义业务生成函数
│   ├── types.ts
│   ├── validation.ts
│   └── create-multiple.ts
└── faker/
    ├── load-faker.ts
    └── locales.ts
```

## 调用链路

```text
await create(options)
  → 加载语言模板，创建独立 Faker
  → createUserModule(faker) 等业务工厂
  → 返回包含 user / notification / sortItem / address 的普通对象

user.generate(input)
  → 用户模块直接生成记录

user.getPage({count: 100, page: 2})
  → createCollection 返回的 getPage
  → 获取或首次生成 100 条记录的快照
  → createDataset 返回的 getPage
  → 复制、筛选、排序、切片并返回分页信息
```

user 只使用 User 一种数据结构，列表、分页、范围查询共用同一 count 的快照。树通过 generate 生成，额外包含 subRows。generate 和 getTree 每次生成新数据。

集合缓存属于模块实例，没有全局业务数据缓存。场景内模块共享 Faker 随机序列；语言加载缓存只保存模板，每次 create 仍创建独立 Faker。

新增业务：编写一个工厂函数，实现 generate，组合 createEntity(generate) 或 createCollection(generateRow)，在 create.ts 中挂载即可。地址等特殊业务只返回需要的方法，不强制提供集合查询。

模块可依赖 common；common 不依赖业务。架构测试检查函数组合、依赖方向及循环依赖。
