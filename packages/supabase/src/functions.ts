import type {SupabaseApiClient, FunctionsApi} from './types';

/**
 * Edge Functions 使用 SDK 原始 invoke，保留响应泛型、自定义 headers、body 和 region。
 * @example
 * const {data, error} = await api.functions.invoke<{ok: boolean}>('send-email', {
 *   body: {to: 'alice@example.com'},
 * });
 * // error 仍为 SDK 原始错误，可读取 FunctionsHttpError.context 获取服务端响应。
 */
export function createFunctionsApi(client: SupabaseApiClient): FunctionsApi {
  return client.functions;
}
