import {StorageKeys} from '@/utils/storage-keys';
import {createSupabaseClient, createSupabaseApi} from '@workspace/supabase';

// 此实例仅属于当前应用；不同应用分别提供自己的环境配置。
export const supabase = createSupabaseClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {auth: {storageKey: StorageKeys.supabaseAuth}}
);

// 统一绑定客户端，认证、数据库、文件与订阅操作均从功能域入口调用。
export const supabaseApi = createSupabaseApi(supabase);
