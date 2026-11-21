import type {
  SupabaseApiClient,
  PageRange,
  PaginationOptions,
  PageQuery,
  PageResult,
  IteratePagesOptions,
} from './types';

/**
 * 将业务页码转换为 Supabase range 使用的起止下标，结束下标包含在内。
 * @param options page 从 1 开始，默认 1；pageSize 默认为 20。
 * @returns {page, pageSize, from, to}，例如第 2 页每页 10 条对应 10～19。
 * @throws RangeError 页码、条数非法，或计算后的下标超出安全整数。
 * @example api.database.getPageRange({page: 2, pageSize: 10}); // {page: 2, pageSize: 10, from: 10, to: 19}
 */
export function getPageRange({page = 1, pageSize = 20}: PaginationOptions = {}): PageRange {
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1) {
    throw new RangeError('page 和 pageSize 必须是大于 0 的安全整数');
  }
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to)) throw new RangeError('分页范围超出安全整数限制');
  return {page, pageSize, from, to};
}

/**
 * 对已配置筛选和排序的 select 查询分页，保留 SDK 的 data/error/count/status。
 * 要获取总页数，select 时需指定 count；请使用稳定排序（例如主键）避免翻页重复。
 * @param query 已构建好的 select 查询，可包含筛选、排序和取消信号。
 * @param options 页码与每页条数；默认读取第 1 页，每页 20 条。
 * @returns SDK 查询结果及 page/pageSize/totalPages/hasNextPage；总数未知时后两项为 null。
 * @example
 * const page = await api.database.paginate(
 *   api.database.from('profiles').select('*', {count: 'exact'}).order('id'),
 *   {page: 2, pageSize: 10},
 * );
 * if (page.error) console.error(page.error);
 */
export async function paginate<Row>(query: PageQuery<Row>, options: PaginationOptions = {}): Promise<PageResult<Row>> {
  const {page, pageSize, from, to} = getPageRange(options);
  const response = await query.range(from, to);
  const totalPages = response.count === null ? null : Math.ceil(response.count / pageSize);
  return {...response, page, pageSize, totalPages, hasNextPage: totalPages === null ? null : page < totalPages};
}

/**
 * 逐页读取；每页重新构造查询，避免复用 SDK 可变查询对象。发生 SDK 错误时抛出原始错误。
 * 提前 break 即停止后续请求；每页读取并非数据库快照，并发写入时可改用主键游标。
 * @param createQuery 每次返回一个新的 select 查询，分页范围由本方法设置。
 * @param options page 为起始页，pageSize 为每页条数，maxPages 可限制最多读取几页。
 * @yields 每一页的查询结果和分页信息；空页不产出，SDK 错误会终止迭代并抛出。
 * @example
 * for await (const page of api.database.iteratePages(
 *   () => api.database.from('profiles').select('*').order('id'),
 *   {pageSize: 100, maxPages: 10},
 * )) {
 *   console.log(page.data);
 * }
 * // 取消请求可在 createQuery 中链式调用 .abortSignal(controller.signal)。
 */
export async function* iteratePages<Row>(
  createQuery: () => PageQuery<Row>,
  options: IteratePagesOptions = {}
): AsyncGenerator<PageResult<Row>> {
  const {page: start, pageSize} = getPageRange(options);
  const maxPages = options.maxPages ?? Infinity;
  if (maxPages !== Infinity && (!Number.isSafeInteger(maxPages) || maxPages < 1))
    throw new RangeError('maxPages 必须是大于 0 的安全整数');
  for (let offset = 0; offset < maxPages; offset++) {
    const result = await paginate(createQuery(), {page: start + offset, pageSize});
    if (result.error) throw result.error;
    if (!result.data.length) return;
    // 总数明确还有后续数据、单页却被截短时，不继续按 pageSize 跳过尚未读取的记录。
    if (result.hasNextPage === true && result.data.length < pageSize) {
      throw new Error('单页返回数量少于请求数量，请减小 pageSize 或检查服务端行数限制后重试');
    }
    yield result;
    if (result.hasNextPage === false || result.data.length < pageSize) return;
  }
}

/**
 * 保留 from/schema/rpc 的 SDK 泛型及链式调用，额外提供分页和逐页读取。
 * @example
 * await api.database.from('profiles').insert({id, email}).select();
 * await api.database.from('profiles').update({email}).eq('id', id).select();
 * await api.database.from('profiles').upsert({id, email}, {onConflict: 'id'}).select();
 * await api.database.from('profiles').delete().eq('id', id).select();
 * await api.database.rpc('search_profiles', {keyword: 'Alice'});
 */
export function createDatabaseApi<Client extends SupabaseApiClient>(client: Client) {
  return {
    // bind 保留 SDK 内部的 this；显式标注以保留重载和泛型签名。
    /**
     * 选择要操作的表或视图；继续链式调用 select/insert/update/upsert/delete 等。
     * @example await api.database.from('profiles').select('id, email').eq('id', id);
     */
    from: client.from.bind(client) as Client['from'],
    /**
     * 切换本次查询使用的数据库 schema，不会修改客户端的全局默认 schema。
     * @example await api.database.schema('private').from('profiles').select('*');
     */
    schema: client.schema.bind(client) as Client['schema'],
    /**
     * 按函数名调用数据库中已暴露的 PostgreSQL 函数，参数为命名参数对象。
     * @example await api.database.rpc('profile_count', {active: true});
     */
    rpc: client.rpc.bind(client) as Client['rpc'],
    getPageRange,
    paginate,
    iteratePages,
  };
}
