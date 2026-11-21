# Supabase

公共包负责组织能力与复用逻辑，不读取环境变量、不创建全局客户端，也不会在创建 API 时发起请求。每个应用维护自己的客户端实例；不同应用或 SSR 请求分别管理客户端生命周期。

## 文件结构

```text
src/
├── index.ts       # 公共入口
├── client.ts      # 创建客户端，保留 SDK 泛型和客户端选项
├── api.ts         # createSupabaseApi，组合各功能域
├── types.ts       # 公共类型及 SDK 类型转出
├── auth.ts        # 完整认证 API：登录、注册、会话、OTP、OAuth、SSO、MFA
├── database.ts    # 类型化查询、schema、RPC、分页、逐页读取
├── profiles.ts    # profiles 业务表的查询、分页、更新和删除
├── storage.ts     # 文件与桶操作、公开地址、签名访问和签名上传
├── realtime.ts    # 表变更、广播、在线状态与订阅清理
├── functions.ts   # Edge Functions
└── result.ts      # 显式将 SDK 返回错误转为异常
```

## 初始化

```ts
import {createSupabaseClient, createSupabaseApi} from '@workspace/supabase';
import type {Database} from './database.types'; // Supabase 为实际项目生成的数据库类型。

const client = createSupabaseClient<Database>(url, publishableKey, {
  auth: {persistSession: true},
});
export const api = createSupabaseApi(client);
```

`api.client` 是传入的原始客户端。`api.auth` 与 `api.functions` 保留 SDK 对象，避免重复实现 SDK 流程；数据库和文件方法保持 SDK 参数、错误格式及链式能力。`api.database.from/schema/rpc` 保留生成数据库类型中的表名、字段和函数参数检查，自定义 schema 也可使用。

UMD 使用方先加载 Supabase SDK 的浏览器脚本（全局名为 `supabase`），再加载本包脚本（全局名为 `BadProjectSupabase`）。然后调用 `BadProjectSupabase.createSupabaseClient(...)` 和 `BadProjectSupabase.createSupabaseApi(client)`。

## 认证与会话

```ts
await api.auth.signUp({
  email,
  password,
  options: {emailRedirectTo: callbackUrl, data: {username: 'Alice'}},
});
await api.auth.signInWithPassword({email, password});
await api.auth.signInAnonymously();
await api.auth.signInWithOtp({email, options: {shouldCreateUser: false}});
await api.auth.verifyOtp({email, token, type: 'email'});
await api.auth.resend({type: 'signup', email});
await api.auth.signInWithOAuth({provider: 'github', options: {redirectTo: callbackUrl}});
await api.auth.signInWithSSO({domain: 'example.com'});

await api.auth.resetPasswordForEmail(email, {redirectTo: resetUrl});
await api.auth.updateUser({password: newPassword});
await api.auth.updateUser({data: {username: 'New name'}});
await api.auth.reauthenticate();
await api.auth.exchangeCodeForSession(code); // PKCE 回调流程。
await api.auth.refreshSession();
await api.auth.setSession({access_token, refresh_token});
const {
  data: {session},
} = await api.auth.getSession();
const {
  data: {user},
} = await api.auth.getUser();
await api.auth.getClaims();
await api.auth.signOut({scope: 'local'});
```

`getSession` 用于读取会话，不应将本地会话数据直接当作服务端鉴权依据。服务端鉴权应按 SDK 的验证流程使用 `getUser` 或 `getClaims`；数据权限仍由服务端与 RLS 策略决定。

### 认证监听与清理

```ts
const {
  data: {subscription},
} = api.auth.onAuthStateChange((event, session) => {
  // 同步保存状态，避免在回调中等待其他 auth 方法。
  console.log(event, session?.user.id);
});
subscription.unsubscribe();
```

### 身份绑定与 MFA

```ts
await api.auth.getUserIdentities();
await api.auth.linkIdentity({provider: 'github'});
await api.auth.unlinkIdentity(identity);

const {data: factors} = await api.auth.mfa.listFactors();
await api.auth.mfa.getAuthenticatorAssuranceLevel();
await api.auth.mfa.enroll({factorType: 'totp', friendlyName: 'Authenticator'});
await api.auth.mfa.challengeAndVerify({factorId, code});
await api.auth.mfa.unenroll({factorId});
```

### 服务端账户管理

`auth.admin` 是认证账户管理，和 `profiles` 业务资料管理不同。以下操作使用服务端管理员客户端，secret/service-role key 不放入前端环境变量。

```ts
const serverApi = createSupabaseApi(serverClient);
await serverApi.auth.admin.listUsers({page: 1, perPage: 20});
await serverApi.auth.admin.getUserById(userId);
await serverApi.auth.admin.createUser({email, password, email_confirm: true});
await serverApi.auth.admin.inviteUserByEmail(email);
await serverApi.auth.admin.updateUserById(userId, {user_metadata: {username: 'Alice'}});
await serverApi.auth.admin.generateLink({type: 'recovery', email});
await serverApi.auth.admin.deleteUser(userId);
```

## 数据查询、写入和 RPC

```ts
const {data, error} = await api.database.from('profiles').select('id, email').eq('email', email).order('id');

await api.database.from('profiles').select('*').in('id', ids);
await api.database.from('profiles').select('*').ilike('email', '%example.com');
await api.database.from('profiles').select('*').eq('id', id).maybeSingle();
await api.database.from('profiles').insert({id, email}).select();
await api.database.from('profiles').insert(rows).select(); // 批量插入。
await api.database.from('profiles').upsert(rows, {onConflict: 'id'}).select();
await api.database.from('profiles').update({email}).eq('id', id).select();
await api.database.from('profiles').delete().in('id', ids).select();
await api.database.schema('private').from('profiles').select('*');
await api.database.rpc('profile_count', {active: true});
```

`private` schema、RPC、表和列必须实际存在并配置访问权限。SDK 的筛选、关联查询、排序、单行查询和取消请求等能力可以继续链式调用，不需要为了每种条件增加一个公共方法。

### 分页

```ts
const page = await api.database.paginate(
  api.database.from('profiles').select('id, email', {count: 'exact'}).order('id'),
  {page: 2, pageSize: 10}
);
if (page.error) throw page.error;
console.log(page.data, page.count, page.totalPages, page.hasNextPage);
```

页码从 1 开始，默认每页 20 条；非法页码和超出安全整数的范围会在请求前抛出 `RangeError`。SDK 返回的 `data/error/count/status/statusText` 均保留。未请求 `count` 时，`totalPages` 与 `hasNextPage` 为 `null`，表示未知；空结果且精确总数为 0 时，两者为 `0` 和 `false`。

### 逐页读取

```ts
const controller = new AbortController();
for await (const page of api.database.iteratePages(
  () => api.database.from('profiles').select('*', {count: 'exact'}).order('id').abortSignal(controller.signal),
  {pageSize: 100, maxPages: 10}
)) {
  console.log(page.data);
  if (shouldStop) break; // 停止后不再请求下一页。
}
```

每页重新调用查询工厂，避免复用 SDK 的可变查询对象；SDK 错误会抛出原始错误并终止迭代。`maxPages` 是可选的读取上限，`page` 可指定起始页。请将 `pageSize` 设置在服务端单次返回行数上限内。offset 分页不提供事务快照，频繁并发写入或大数据导出可使用原生查询按唯一主键实现游标分页。

## 业务资料 profiles

```ts
const page = await api.profiles.getPage({
  page: 1,
  pageSize: 10,
  columns: 'id, email',
  email: 'alice@example.com',
  orderBy: 'id',
  ascending: true,
  signal: controller.signal,
});
await api.profiles.getById(userId); // 找不到时 data 为 null。
await api.profiles.getByEmail(email); // 数组，不假定邮箱唯一。
await api.profiles.updateById(userId, {username: 'Alice'});
await api.profiles.deleteById(userId); // 仅删除业务资料，不删除认证账户。
```

这组方法约定业务表名为 `profiles`，包含 `id/email` 列；不自动创建表、迁移字段或绕过 RLS。`getPage` 默认按 `id` 稳定排序并请求精确总数。更新和删除始终携带 id 过滤，空 id 会拒绝；`updateById` 不接受修改主键。业务字段随应用变化，需严格字段推导时使用 `api.database.from('profiles')`。

## 文件与桶

```ts
await api.storage.upload('avatars', 'alice.png', file, {upsert: true, cacheControl: '3600'});
await api.storage.update('avatars', 'alice.png', file);
const {data: blob} = await api.storage.download('avatars', 'alice.png');
await api.storage.list('avatars', 'users', {limit: 20, offset: 0, sortBy: {column: 'name', order: 'asc'}});
await api.storage.move('avatars', 'old.png', 'users/new.png');
await api.storage.copy('avatars', 'alice.png', 'backup/alice.png');
await api.storage.remove('avatars', ['a.png', 'b.png']);
await api.storage.exists('avatars', 'alice.png');
await api.storage.info('avatars', 'alice.png');

const {
  data: {publicUrl},
} = api.storage.getPublicUrl('avatars', 'alice.png');
await api.storage.createSignedUrl('private', 'report.pdf', 60); // 秒。
await api.storage.createSignedUrls('private', ['a.pdf', 'b.pdf'], 60);
const {data: signed, error} = await api.storage.createSignedUploadUrl('private', 'report.pdf');
if (error) throw error;
await api.storage.uploadToSignedUrl('private', signed.path, signed.token, file);

await api.storage.listBuckets();
await api.storage.getBucket('avatars');
await api.storage.createBucket('avatars', {public: false, fileSizeLimit: 1024 * 1024});
await api.storage.updateBucket('avatars', {public: false});
await api.storage.emptyBucket('avatars'); // 显式删除其中的文件。
await api.storage.deleteBucket('avatars'); // 删除空桶。
```

`getPublicUrl` 只拼接公开地址，不发请求，不验证文件是否存在，也不会将桶改为公开。私有文件使用签名地址。文件方法的选项和响应保持 SDK 格式；SDK 的其他桶能力或复杂下载返回类型，继续使用 `api.storage.from(bucket)`。

## 实时订阅

### 数据库变更

```ts
const subscription = api.realtime.subscribeToTable<{id: string; email: string}>(
  {table: 'profiles', schema: 'public', filter: 'id=eq.alice'},
  (payload) => console.log(payload.eventType, payload.new, payload.old),
  (status, error) => console.log(status, error)
);
// React useEffect cleanup：return () => { void subscription.unsubscribe(); };
await subscription.unsubscribe();
```

服务端需启用表的 Realtime publication。默认生成独立频道名，避免同一客户端的多次订阅互相移除；显式传入相同 `channelName` 时，由调用方协调共享频道。清理方法调用 `removeChannel` 并复用清理任务，避免反复移除；仍需检查其 SDK 返回状态。需要重新尝试清理时可直接调用 `api.realtime.removeChannel(channel)`。

### 广播与在线状态

```ts
const subscription = api.realtime.subscribeToBroadcast<{text: string}>('room:lobby', 'message', (payload) =>
  console.log(payload.text)
);
// 等待频道 SUBSCRIBED 后再发送消息：
await subscription.channel.send({type: 'broadcast', event: 'message', payload: {text: 'Hello'}});
await subscription.unsubscribe();

const presence = api.realtime.subscribeToPresence('room:presence', (state) => console.log(state));
// 等待频道 SUBSCRIBED 后：
await presence.channel.track({userId: 'alice'});
await presence.channel.untrack();
await presence.unsubscribe();
```

广播泛型描述业务协议，运行时数据结构可由应用使用 schema 校验。需要组合事件或定制 private/presence/broadcast 选项时，使用原生 `api.realtime.channel(name, options)`；同时保留 `getChannels/removeChannel/removeAllChannels`。

## Edge Functions

```ts
const {data, error} = await api.functions.invoke<{ok: boolean}>('hello', {
  body: {name: 'Alice'},
  headers: {'x-request-id': requestId},
});
if (error) console.error(error);
```

## 错误处理

各方法默认保留 SDK 的 `{data, error}`，不隐式吞掉错误，也不把失败当成空数组。参数校验、迭代读取及以下显式助手使用异常；网络异常是否转为 SDK 错误沿用 SDK 行为。

```ts
import {result} from '@workspace/supabase';

const rows = result.unwrap(await api.database.from('profiles').select('*'));
const profile = result.requireData(await api.profiles.getById(id), '用户资料不存在');
```

`unwrap` 抛出原始错误，否则返回 data（可为 null）；`requireData` 同时拒绝 null/undefined。空数组、0、false 和空字符串仍是有效数据。

## 调用迁移

```ts
// 原有独立函数调用改为实例绑定的功能域调用：
// signInWithPassword(client, credentials) → api.auth.signInWithPassword(credentials)
// signOut(client) → api.auth.signOut()
// getPageProfiles(client, 1, 10) → api.profiles.getPage({page: 1, pageSize: 10})
// getProfileByEmail(client, email) → api.profiles.getByEmail(email)
// findUserById(serverClient, id) → serverApi.auth.admin.getUserById(id)
```

管理端统一在 `src/supabase/index.ts` 导出 `supabaseApi`，原始客户端 `supabase` 仍可使用。公共类型统一从包入口导入。

## 验证

```sh
pnpm --filter @workspace/supabase typecheck
pnpm --filter @workspace/supabase lint
pnpm --filter @workspace/supabase test
```

测试构建后使用 SDK 配合注入的离线 fetch 验证请求参数、分页和错误行为；实时频道使用测试替身验证事件和清理，不访问真实服务。`tests/contracts.ts` 检查生成数据库类型、自定义 schema、RPC 参数、分页推导和 Functions 泛型。这些检查不替代真实项目的 RLS、认证配置、存储策略和 Realtime publication 集成验证。
