import type {DataResult} from './types';

/** 默认各 API 保留 SDK 返回格式；只有显式调用这些方法才将 SDK 错误转为异常。 */
export const result = {
  /**
   * 抛出原始 error，否则返回 data；maybeSingle 未命中时仍可返回 null。
   * @param response 已 await 的 SDK 查询结果，不要直接传入 Promise。
   * @returns 原始 data，不额外转换空值或空数组。
   * @example
   * const rows = result.unwrap(await api.database.from('profiles').select('*'));
   */
  unwrap<T>(response: DataResult<T>): T {
    if (response.error != null) throw response.error;
    return response.data;
  },
  /**
   * 除 SDK 错误外，也拒绝 null/undefined 数据；空数组、0、false 都是有效数据。
   * @param response 已 await 的 SDK 查询结果。
   * @param message 数据为空时抛出的错误文本，默认“未返回数据”。
   * @returns 排除了 null/undefined 的 data。
   * @example
   * const profile = result.requireData(await api.profiles.getById(id), '用户资料不存在');
   */
  requireData<T>(response: DataResult<T>, message = '未返回数据'): NonNullable<T> {
    if (response.error != null) throw response.error;
    if (response.data == null) throw new Error(message);
    return response.data;
  },
};
