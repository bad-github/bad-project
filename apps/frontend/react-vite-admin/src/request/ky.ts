import {StorageKeys} from '../utils/storage-keys';
import {LS} from '@/utils/storage';
import {isDev} from '@/utils/tool';
import type {Options} from 'ky';
import kyApi from 'ky';

// 末尾不包含/，则请求url需要添加/
const API_PREFIX = `/${import.meta.env.VITE_APP_NAME}/api`;

const ky = kyApi.create({
  prefixUrl: API_PREFIX, // 自动拼接前缀
  timeout: 10000,
  retry: 0, // 默认关闭自动重试
  credentials: 'include',
  headers: {
    'X-Requested-With': 'ky',
    'Content-Type': 'application/json',
  },
  hooks: {
    beforeRequest: [
      (request, _options) => {
        if (isDev()) {
          const token = LS.get(StorageKeys.token);
          if (token) {
            request.headers.set('Authorization', `Bearer ${token}`);
          }
        }
      },
    ],
    beforeRetry: [
      /* async ({request, options, error, retryCount}) => {
        const token = await ky('https://example.com/refresh-token');
        request.headers.set('Authorization', `Bearer ${token}`);
      } */
      /*  async ({request, options, error, retryCount}) => {
        const shouldStopRetry = await ky('https://example.com/api');
        if (shouldStopRetry) {
          return ky.stop;
        }
      } */
    ],
    // 保留 ky 原生 HTTPError，只补充响应体和更友好的错误信息
    beforeError: [
      async (error) => {
        const response = error.response;
        const isJson = response.headers.get('content-type')?.includes('json');
        let data: unknown;
        try {
          data = isJson ? await response.clone().json() : await response.clone().text();
        } catch {
          data = undefined;
        }

        const responseMessage =
          data && typeof data === 'object' && 'message' in data ? (data as {message?: unknown}).message : data;

        error.message =
          typeof responseMessage === 'string' && responseMessage
            ? responseMessage
            : `${response.status} ${response.statusText}`.trim();

        Object.assign(error, {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          data,
        });

        return error;
      },
    ],
    afterResponse: [
      async (_request, _options, response) => {
        // 重定向
        if (response.redirected) {
          window.location.assign(response.url);
        }
        // 非 2xx 响应交给 ky 生成 HTTPError，再由 beforeError 补充信息
        if (!response.ok) {
          return response;
        }

        const isJson = response.headers.get('content-type')?.includes('json');
        if (!isJson) {
          return response;
        }

        const data: {code?: unknown; message?: unknown} = await response.clone().json();

        // HTTP 成功但业务码失败时，也必须抛出 Error，不能直接抛普通对象
        if (data.code !== undefined && data.code !== 200) {
          const message = typeof data.message === 'string' && data.message ? data.message : '业务请求失败';
          throw Object.assign(new Error(message), {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            data,
          });
        }

        return response;
      },
    ],
  },
  // 只是对 Response.body 做 ReadableStream 读取，不会干涉 ky 构造请求体的行为
  onDownloadProgress: (_progress, _chunk) => {
    /**
     * chunk：是 Uint8Array 的一个实例，其中包含已发送的数据。第一次调用为空。
     * progress
     *  percent：进度百分比
     *  transferredBytes：已传输的字节数
     *  totalBytes：总字节数。估计值，如果无法确定总大小，则可能为0
     */
    // console.log(`${progress.percent * 100}% - ${progress.transferredBytes} of ${progress.totalBytes} bytes`);
  },
  /**
   * 只要这个配置存在，ky 就把 request.body 处理成 ReadableStream，以便监听上传进度
   * 而某些请求体（比如 { json: {...} }）不能和 ReadableStream 同时使用
   * 这就导致了请求体被破坏或无法正确发送，从而出现 POST 请求失败
   * 具体接口用到的时候手动传
   */
  // onUploadProgress: (progress, chunk) => {
  //   // chunk：是 Uint8Array 的实例，其中包含已发送的数据。最后一次调用为空
  //   console.log(`${progress.percent * 100}% - ${progress.transferredBytes} of ${progress.totalBytes} bytes`);
  // },
  // 控制响应的json如何被解析
  parseJson: (text) => {
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('Ky Response: JSON parse error');
    }
  },
  // 控制发请求的json如何被序列化
  stringifyJson: (json) => {
    return JSON.stringify(json);
  },
});

const kyGet = <T>(url: string, options?: Options) => {
  return ky.get(url, options).json<T>();
};
const kyPost = <T>(url: string, options?: Options) => {
  return ky.post(url, options).json<T>();
};
const kyPut = <T>(url: string, options?: Options) => {
  return ky.put(url, options).json<T>();
};
const kyDelete = <T>(url: string, options?: Options) => {
  return ky.delete(url, options).json<T>();
};
const kyPatch = <T>(url: string, options?: Options) => {
  return ky.patch(url, options).json<T>();
};

export {API_PREFIX, kyGet, kyPost, kyPut, kyDelete, kyPatch};
export default ky;

/**
 * 不同content-type需要发送的格式
 * multipart/form-data {body: new FormData()}
 * application/x-www-form-urlencoded {body: new URLSearchParams()}
 * application/json {json: {}}
 */
