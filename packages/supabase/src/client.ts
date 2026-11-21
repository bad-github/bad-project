/**
 * 创建 Supabase SDK 客户端，统一连接认证、数据库、存储、实时频道与 Edge Functions。
 * @param supabaseUrl 项目的 API 地址。
 * @param supabaseKey 客户端使用的项目密钥；浏览器使用 publishable/anon key。
 * @param options SDK 配置，例如 auth 会话持久化、db.schema、自定义 fetch。
 * @returns 原始 SDK 客户端；可传给 createSupabaseApi 获得按功能分组的入口。
 * @example const client = createSupabaseClient<Database>(url, publishableKey, {auth: {persistSession: true}});
 */
export {createClient as createSupabaseClient} from '@supabase/supabase-js';
