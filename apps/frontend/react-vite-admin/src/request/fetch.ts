import {StorageKeys} from '../utils/storage-keys';
import {LS} from '@/utils/storage';

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestOptions = {
  method?: HTTPMethod;
  params?: Record<string, string | number | boolean>;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

/**
 * API_PREFIX=应用名+网关前缀（推荐加上后/，请求方法就可以不用写前/），需要理解
 * 本地：proxy代理了API_PREFIX。为了保持一致，可以在代理时完全不重写路径，直接转发到nginx服务，和线上一样
 * 线上：proxy代理是不生效的，所以网络请求势必包含API_PREFIX，这个时候就需要nginx转发
 *
 * 网关前缀是否需要：
 * 对于大型应用，不需要加网关前缀。比如这个大型应用包含很多服务，每种服务都有自己的网关前缀
 * 此时只需要代理应用名即可。但若所有服务的网关同时也有一个统一的前缀，也可以加上这个网关前缀。proxy代理同理
 */
const API_PREFIX = `/${import.meta.env.VITE_APP_NAME}/api`;

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return undefined;
  }

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  const isJson = contentType.includes('application/json') || contentType.includes('+json');
  if (!isJson) {
    return text;
  }

  return JSON.parse(text);
}

function getErrorMessage(response: Response, data: unknown): string {
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as {message?: unknown}).message;
    if (typeof message === 'string' && message) {
      return message;
    }
  }

  if (typeof data === 'string' && data) {
    return data;
  }

  return response.statusText ? `${response.status} ${response.statusText}` : `HTTP ${response.status}`;
}

const request = async <T = unknown>(url: string, options: RequestOptions = {}): Promise<T> => {
  const {method = 'GET', params, body, headers, signal} = options;
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => query.set(key, String(value)));

  const prefix = API_PREFIX;
  const queryString = query.size ? `${url.includes('?') ? '&' : '?'}${query}` : '';
  const token = LS.get(StorageKeys.token);
  const response = await fetch(`${prefix}${url}${queryString}`, {
    method,
    credentials: 'include',
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(import.meta.env.DEV && token ? {Authorization: `Bearer ${token}`} : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await parseResponse(response);

  if (!response.ok) {
    throw Object.assign(new Error(getErrorMessage(response, data)), {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      data,
    });
  }

  return data as T;
};

export const fetchRequest = <T = unknown>(url: string, options: RequestOptions = {}): Promise<T> => {
  return request<T>(url, options);
};
