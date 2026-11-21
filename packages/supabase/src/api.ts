import type {SupabaseApiClient} from './types';
import {createAuthApi} from './auth';
import {createDatabaseApi} from './database';
import {createProfilesApi} from './profiles';
import {createStorageApi} from './storage';
import {createRealtimeApi} from './realtime';
import {createFunctionsApi} from './functions';

/**
 * 将同一个客户端绑定到各功能域，不创建全局实例，不读取环境变量，也不立即发请求。
 * 查询默认保留 SDK 的 {data, error}；需要抛出错误时显式使用 result.unwrap。
 * @example
 * const client = createSupabaseClient<Database>(url, publishableKey);
 * const api = createSupabaseApi(client);
 * await api.auth.signInWithPassword({email, password});
 * await api.database.from('profiles').select('id, email');
 * await api.storage.upload('avatars', 'user/avatar.png', file);
 */
export function createSupabaseApi<Client extends SupabaseApiClient>(client: Client) {
  return {
    /** 原始 SDK 客户端，用于访问尚未提供快捷入口的 SDK 能力。 */
    client,
    /** 注册、登录、会话管理、身份绑定、MFA 与认证账户管理。 */
    auth: createAuthApi(client),
    /** 通用数据库查询、增删改、RPC、schema 及分页读取。 */
    database: createDatabaseApi(client),
    /** profiles 业务资料表的常用查询、更新和删除。 */
    profiles: createProfilesApi(client),
    /** 存储桶、文件上传下载、文件移动复制与临时签名地址。 */
    storage: createStorageApi(client),
    /** 实时表变更、频道广播和在线状态订阅。 */
    realtime: createRealtimeApi(client),
    /** 调用已部署的 Supabase Edge Functions。 */
    functions: createFunctionsApi(client),
  };
}
