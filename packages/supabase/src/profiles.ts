import type {SupabaseApiClient, ProfileListOptions} from './types';
import {paginate} from './database';

/**
 * profiles 是应用的业务表，和 auth.users 不是同一张表。
 * 这里约定有 id、email 列；其他字段通过原生 from 查询维护，权限由表的 RLS 策略决定。
 * @example
 * const profiles = createSupabaseApi(client).profiles;
 * const page = await profiles.getPage({page: 1, pageSize: 10, email: 'alice@example.com'});
 * const one = await profiles.getById(userId);
 * await profiles.updateById(userId, {username: 'Alice'});
 */
export function createProfilesApi(client: SupabaseApiClient) {
  return {
    /**
     * 分页读取 profiles 业务资料，默认按 id 升序排列，并查询精确总数。
     * @param options 支持 page/pageSize、columns、email、orderBy、ascending 和取消用的 signal。
     * @returns 记录数组、SDK error/count/status，以及总页数、是否存在下一页等信息。
     * @example const page = await api.profiles.getPage({page: 1, pageSize: 10, email: 'alice@example.com'});
     */
    getPage(options: ProfileListOptions = {}) {
      let query = client.from('profiles').select(options.columns ?? '*', {count: 'exact'});
      if (options.email !== undefined) query = query.eq('email', options.email);
      query = query.order(options.orderBy ?? 'id', {ascending: options.ascending ?? true});
      if (options.signal) query = query.abortSignal(options.signal);
      return paginate(query, options);
    },
    /**
     * 根据资料主键读取一条 profiles 记录，不查询 auth.users 认证账户。
     * @param id 资料主键，不能为空。
     * @returns {data, error}；未匹配记录时 data 为 null，不会仅因未找到而报错。
     * @example const {data: profile, error} = await api.profiles.getById(userId);
     */
    getById(id: string) {
      if (!id.trim()) throw new TypeError('id 不能为空');
      return client.from('profiles').select('*').eq('id', id).maybeSingle();
    },
    /**
     * 按完整邮箱地址精确匹配 profiles 资料；不用于判断邮箱是否已注册认证账户。
     * @param email 邮箱地址，不能为空。
     * @returns {data, error}；data 是数组，因为这里没有假定业务表的邮箱列唯一。
     * @example const {data: profiles} = await api.profiles.getByEmail('alice@example.com');
     */
    getByEmail(email: string) {
      if (!email.trim()) throw new TypeError('email 不能为空');
      return client.from('profiles').select('*').eq('email', email);
    },
    /**
     * 修改指定 profiles 资料，并读取更新后的记录；不会修改认证账户的密码或登录邮箱。
     * @param id 要更新的资料主键，始终作为 eq 过滤条件，不能为空。
     * @param values 需要修改的业务字段；不允许在其中修改主键 id。
     * @returns {data, error}；data 为更新后的记录，未匹配时为 null。
     * @example await api.profiles.updateById(userId, {username: 'Alice'});
     */
    updateById(id: string, values: Record<string, unknown>) {
      if (!id.trim()) throw new TypeError('id 不能为空');
      if (Object.hasOwn(values, 'id')) throw new TypeError('updateById 不支持修改主键 id');
      return client.from('profiles').update(values).eq('id', id).select().maybeSingle();
    },
    /**
     * 删除指定 profiles 业务资料，始终按 id 过滤；不会调用认证服务删除账户。
     * @param id 要删除的资料主键，不能为空。
     * @returns {data, error}；data 为被删除的记录，未匹配时为 null。
     * @example await api.profiles.deleteById(userId);
     */
    deleteById(id: string) {
      if (!id.trim()) throw new TypeError('id 不能为空');
      return client.from('profiles').delete().eq('id', id).select().maybeSingle();
    },
  };
}
