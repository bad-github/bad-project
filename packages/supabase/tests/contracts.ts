import {createSupabaseApi, createSupabaseClient, result} from '../src';
import type {PageResult, PaginationOptions, Session} from '../src';

type Profile = {id: string; email: string; username: string | null};
type Schema = {
  Tables: {
    profiles: {
      Row: Profile;
      Insert: {id: string; email: string; username?: string | null};
      Update: Partial<Profile>;
      Relationships: [];
    };
  };
  Views: Record<never, never>;
  Functions: {profile_count: {Args: {active: boolean}; Returns: number}};
};
type Database = {public: Schema; private: Schema};

// 仅参加类型检查，不执行真实请求，也不进入构建产物。
export async function checkSupabaseContracts() {
  const client = createSupabaseClient<Database>('https://example.supabase.co', 'publishable-key');
  const api = createSupabaseApi(client);
  const options = {page: 1, pageSize: 10} satisfies PaginationOptions;
  const page = await api.database.paginate(api.database.from('profiles').select('id, email').order('id'), options);
  page satisfies PageResult<{id: string; email: string}>;
  if (!page.error) page.data[0].email satisfies string;
  // @ts-expect-error typed client 不接受未声明的表。
  api.database.from('unknown_table');
  // @ts-expect-error typed client 不接受未声明的写入字段。
  api.database.from('profiles').insert({id: '1', email: 'a@example.com', unknown: true});
  api.database.rpc('profile_count', {active: true});
  // @ts-expect-error RPC 参数需要符合生成的数据库类型。
  api.database.rpc('profile_count', {active: 'yes'});
  api.database.schema('private').from('profiles').select('id');
  const privateClient = createSupabaseClient<Database, 'private'>('https://example.supabase.co', 'publishable-key', {
    db: {schema: 'private'},
  });
  createSupabaseApi(privateClient).database.from('profiles').select('id');
  const invoked = await api.functions.invoke<{ok: boolean}>('hello', {body: {id: '1'}});
  if (invoked.data) invoked.data.ok satisfies boolean;
  const session: Session | null = (await api.auth.getSession()).data.session;
  api.auth.mfa.listFactors();
  api.storage.upload('avatars', 'alice.png', new Blob(['image']), {upsert: true});
  const subscription = api.realtime.subscribeToTable<Profile>({table: 'profiles'}, (payload) => {
    if (payload.eventType === 'INSERT') payload.new.email satisfies string;
  });
  subscription.unsubscribe();
  const required = result.requireData({data: session, error: null});
  required satisfies Session;
  result.unwrap({data: false, error: null}) satisfies boolean;
}
