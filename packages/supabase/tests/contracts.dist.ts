import {createSupabaseApi, createSupabaseClient, FunctionsHttpError} from '@workspace/supabase';
import type {PaginationOptions} from '@workspace/supabase';
import * as library from '@workspace/supabase';

// 通过 package exports 消费构建后的声明，检查发布产物未丢失泛型或导出不存在的运行时成员。
export function checkBuiltDeclarations() {
  const client = createSupabaseClient<{
    public: {
      Tables: {items: {Row: {id: string}; Insert: {id: string}; Update: {id?: string}; Relationships: []}};
      Views: Record<never, never>;
      Functions: Record<never, never>;
    };
  }>('https://example.supabase.co', 'offline-key');
  const api = createSupabaseApi(client);
  api.database.from('items').insert({id: 'one'});
  // @ts-expect-error 发布声明必须保留合法表名约束。
  api.database.from('unknown');
  const options: PaginationOptions = {page: 1, pageSize: 10};
  api.database.paginate(api.database.from('items').select('*'), options);
  new FunctionsHttpError(new Response('Offline error', {status: 400}));
  // @ts-expect-error 不应从声明中误导出原始 SDK 的 createClient 运行时成员。
  void library.createClient;
}
