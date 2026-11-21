# Mock

按业务划分普通函数模块，使用公共集合工具组合 `generate / getAll / getPage / getRange`，不使用 Controller / Service 分层。用户统一使用 User 数据结构。

## 创建场景

```ts
import {create} from '@workspace/mock';
import {fakerLoaders} from '@workspace/mock/locales';

const app = await create({
  loaders: fakerLoaders,
  language: 'zh-CN',
  seed: 42,
  refDate: '2026-01-01T00:00:00Z',
});
```

每次 create 创建独立 Faker 和业务模块。相同 Faker 版本、语言、seed、refDate 和调用顺序可复现数据；场景内业务共享随机序列。未指定 seed 时随机生成，未指定 refDate 时取场景创建时间。需要重复读取同一份数据时，请复用 app 实例。

## 用户

```ts
const {user} = app;

user.generate({firstName: 'Alice', address: {city: '上海'}});
user.getAll(); // 默认 300 条完整用户
user.getAll(100);
user.getPage({count: 100, page: 2, pageSize: 20});
user.getRange(20, 20, {count: 100});

user.generate({firstName: 'Alice', text: ''});
user.getTree(100, 2); // 100 个父项，每项包含 2 个子项
```

- 完整用户包含账号、地址、偏好、工作经历等资料。嵌套覆盖按字段合并，数组整体替换，undefined 表示未指定；可变覆盖值会复制。年龄按 UTC 生日计算，显式 age 为 0～120 的整数，同时提供生日和年龄时必须一致。
- 用户包含 name、text、progress、status，列表和树也使用同一种完整记录，年龄默认 18～60。
- 用户树子节点字段为 subRows；单次生成树内 ID 唯一。所有层级数量在生成前检查，空层终止展开。

原 getSimpleOne/getSimpleAll/getSimplePage/getSimpleRange 已合并到 generate/getAll/getPage/getRange，SimpleUser 类型改用 User。原轻量列表和树现在也包含完整资料，生成和复制成本相应增加。

## 列表、分页和范围读取

generate 每次生成新记录，可传字段覆盖。列表及分页则读取稳定数据：每个业务模块按 count 缓存快照。

```ts
const query = {
  filter: (row: {age: number}) => row.age >= 18,
  compare: (a: {id: number}, b: {id: number}) => a.id - b.id,
};

const all = user.getAll(100, query);
const page = user.getPage({count: 100, page: 1, pageSize: 20, ...query});
// page.data 与 all.slice(0, 20) 一致。
```

| 参数／返回 | 约定 |
| --- | --- |
| count | 数据集原始数量，默认 300；不同数量使用独立缓存，允许 0 |
| page / pageSize | 默认 1 / 20，均为正整数 |
| start / limit | 偏移从 0 开始，limit 允许为 0 |
| getAll | 返回筛选、排序后的全部记录数组 |
| getPage | 返回 data、total、page、pageSize、totalPages、start、limit、hasMore |
| getRange | 返回 data、total、start、limit、hasMore |

同一场景、同一业务模块、相同 count 的查询读取同一快照。筛选、排序不参与缓存键，始终执行「复制快照 → 筛选 → 稳定排序 → 按需切片」。total 为筛选后数量；越界返回空数组，空结果 totalPages 为 0。非法数量、页码或偏移计算会在生成前被拒绝。

输入、输出和回调操作均与快照隔离。底层使用 structuredClone，保留 Date、Map、BigInt，不接受函数或 Symbol 等不可克隆记录。generate 仍可返回任意 JS 值。查询过程复制快照，适合有限规模的演示数据；创建不同 count 会保存不同集合。

## 其他业务

```ts
app.notification.generate({read: false});
app.notification.getAll(5);
app.notification.getPage({count: 50, pageSize: 10});

app.sortItem.generate({name: 'A1', type: 'A'});
app.sortItem.getAll(10);
app.sortItem.getPage({count: 50, pageSize: 10});
app.sortItem.getByType('A', 10); // 分组项的 ID 和名称为 A1、A2……

app.address.getTree({provinceCount: 2, cityCount: 3, districtCount: 0});
```

通知和排序项组合相同的通用查询工具。地址本身是树，提供 getTree；数量可为固定整数或 `{min, max}` 闭区间，不保证真实行政隶属关系。通知时间相对场景 refDate 生成。

已有记录可使用 `dataset.create(rows)` 建立快照，再调用 getAll/getPage/getRange。外部业务可使用 `defineEntity((faker, input = {}) => record)`，通过 `app.entity(definition)` 获取同样的 generate/getAll/getPage/getRange 入口。

## 管理端使用

| 场景 | 使用的方法 |
| --- | --- |
| 用户请求 | user.getAll |
| 通知 | notification.getAll |
| 固定／动态高度列表 | user.getAll |
| 无限列表 | user.getRange |
| 表格和用户树 | user.getTree |
| 拖拽排序 | sortItem.getByType |
| 地址树 | address.getTree |

管理端 getMock 只适配当前界面语言。无限列表在页面模块加载时创建并保留用户模块，复用其查询快照；语言在模块初始化时确定。请求延迟、响应包装、缓存生命周期、上传、IndexedDB 操作及交互状态由管理端负责。

## 语言与构建

`@workspace/mock/locales` 提供 zh-CN、zh-TW、en 的动态加载器，导入时不下载语言数据。未注册语言默认回退 en；fallbackLanguage 为 false 时拒绝回退。复用 loaders 对象可合并并发加载，失败后可重试；每个场景仍得到独立 Faker。

可通过 `create({faker: template, seed, refDate})` 使用已有 Faker 模板；loadFaker、createFakerInstance 可独立使用。ESM/CJS 提供核心和 locales 双入口。UMD 宿主通过 `BadProjectMock.create({faker: template})` 提供模板，核心不内嵌 Faker 或语言数据。

目录与调用顺序见 [架构说明](./ARCHITECTURE.md)。

```sh
pnpm --filter @workspace/mock typecheck
pnpm --filter @workspace/mock lint
pnpm --filter @workspace/mock test
```
