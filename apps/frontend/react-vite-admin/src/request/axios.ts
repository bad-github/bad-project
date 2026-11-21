import {StorageKeys} from '../utils/storage-keys';
import axios, {AxiosHeaders, CanceledError} from 'axios';
import type {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios';
import type {
  AuthRequestConfig,
  AuthTokens,
  CreateRequestOptions,
  HttpResponse,
  RefreshClient,
  RequestAuth,
  RequestConfig,
} from './types';

export const createRequest = (options?: CreateRequestOptions) => {
  const {
    interceptors,
    authAdapter,
    // 剩余字段都是 Axios 原生配置，包括 baseURL、timeout、headers、withCredentials 等。
    ...axiosOptions
  } = options || {};
  const instanceOptions = {
    // 默认值放在前面，调用方传入的配置优先。
    timeout: 60000,
    ...axiosOptions,
    // 合并默认头，不能因传入一个自定义头就丢掉其余默认头。
    headers: {'Content-Type': 'application/json', ...axiosOptions.headers},
  };
  const instance: AxiosInstance = axios.create(instanceOptions);
  // 这只是 request 的转发入口，不是新的 Axios 实例。
  // 刷新请求也使用 instance，但强制 skipAuth，刷新接口 401 会直接失败，也会进入刷新流程，避免递归等待。
  // 返回原始 AxiosResponse，不执行业务响应扩展，便于适配器解析刷新接口自己的结构。
  const refreshClient: RefreshClient = {
    request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D>) {
      const refreshConfig = {...config, skipAuth: true};
      return instance.request<T, R, D>(refreshConfig);
    },
  };

  // 创建时使用默认适配器，configureAuth 可覆盖；两者都未提供时不启用自动刷新。
  let auth: RequestAuth | undefined = authAdapter;
  // 当前正在执行的刷新任务。同一实例的所有并发 401 都等待它，无需额外请求队列。
  // 任务包含“刷新 + 保存凭证”，成功或失败后都会清空，允许之后再次刷新。
  let refreshPromise: Promise<void> | undefined;
  // 刷新成功后加 1。只用于识别迟到的旧凭证 401，不记录会话或失败轮次。
  // 例如 A、B 使用版本 0：A 刷新成功后版本变为 1，B 的迟到 401 直接重试即可。
  let tokenVersion = 0;

  const refreshAccessToken = (adapter: RequestAuth) => {
    if (!refreshPromise) {
      // 用微任务统一处理同步抛错，并先完成共享 Promise 赋值。
      refreshPromise = Promise.resolve()
        .then(() => adapter.refreshToken(refreshClient))
        .then((tokens) => {
          if (!tokens?.accessToken) throw new Error('刷新接口未返回有效 accessToken');
          adapter.setTokens(tokens);
          tokenVersion += 1;
        })
        .catch((error: unknown) => {
          // 通知放在共享任务内，而不是每个等待者中，避免重复提示。
          try {
            adapter.onRefreshError?.(error);
          } catch (callbackError) {
            console.error('刷新失败回调异常', callbackError);
          }
          // 所有等待的原请求都收到同一失败，不重试，也不会一直挂起。
          throw error;
        })
        .finally(() => {
          refreshPromise = undefined;
        });
    }
    return refreshPromise;
  };

  // 请求拦截器按注册顺序反向执行：先注册内部认证，后注册外部扩展。
  // 实际顺序：外部扩展 → 内部认证 → HTTP 请求；原请求重试也走相同流程。
  instance.interceptors.request.use((config) => {
    const next = config as AuthRequestConfig;
    next.headers = AxiosHeaders.from(next.headers);

    // 公共接口和刷新请求跳过自动附加凭证及 401 恢复。
    if (next.skipAuth) return next;

    if (auth) {
      const token = auth.getAccessToken();
      next._tokenVersion = tokenVersion;
      if (token) next.headers.set('Authorization', `Bearer ${token}`);
      else next.headers.delete('Authorization');
    }
    return next;
  });

  // 外部请求扩展直接使用 Axios 原生 use，保留 onFulfilled/onRejected/options 的语义。
  const requestExtension = interceptors?.request;
  if (requestExtension) {
    instance.interceptors.request.use(
      requestExtension.onFulfilled,
      requestExtension.onRejected,
      requestExtension.options
    );
  }

  // 此拦截器只负责 HTTP 401 的恢复，保持 AxiosResponse 原始结构。
  // 外部响应扩展在 sendRequest 中执行，避免同一实例重试时重复校验。
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: unknown) => {
      // 1. 错误类型与 HTTP 状态：先确认它是 Axios 返回的 HTTP 401。
      if (!axios.isAxiosError(error)) throw error;
      if (error.response?.status !== 401) throw error;

      // 2. 请求配置：缺少原请求就无法重发；公共接口不进入自动刷新。
      const config = error.config as AuthRequestConfig | undefined;
      if (!config) throw error;
      if (config.skipAuth) throw error;

      // 3. 认证能力：外部未提供适配器时，按普通错误处理。
      if (!auth) throw error;

      // 4. 重试限制：重试仍然 401 时直接失败，避免无限刷新。
      // 终止错误交给 sendRequest 中的响应 onRejected 扩展处理。
      if (config._authRetried) throw error;
      config._authRetried = true;

      // 当前凭证尚未更新：启动刷新或等待已有刷新。
      // 版本已经更新：这是旧请求的迟到 401，直接使用最新凭证重试。
      if (config._tokenVersion === tokenVersion) await refreshAccessToken(auth);

      // 等待期间请求可能已取消：只取消原请求，不影响其他请求共享的刷新。
      config.cancelToken?.throwIfRequested(); // 兼容 Axios 旧的取消方式；已取消就抛出异常
      if (config.signal?.aborted) throw new CanceledError('请求已取消');
      // 保留原 URL、方法、参数等；请求拦截器会重新附加最新 token。
      // 重试复用当前实例，_authRetried 会阻止再次刷新。
      return instance.request(config);
    }
  );

  /**
   * 所有方法都返回响应体 T，而不是 AxiosResponse 或隐式套一层 HttpResponse<T>。
   * T 表示完整响应体：普通 JSON 用 get<User>()，业务包裹结构用 get<HttpResponse<User>>()。
   * 下载可用 get<Blob>(url, {responseType: 'blob'})。
   * 响应 onFulfilled 必须返回 AxiosResponse（可修改其 data），解包统一在这里完成。
   * onRejected 遵循 Axios 语义：抛错/reject 保持失败；返回 AxiosResponse 可主动恢复成功。
   */
  const sendRequest = <T>(config: RequestConfig): Promise<T> => {
    // instance 内部先完成 HTTP 请求及 401 刷新/重试，再扩展最终响应。
    // 不把业务响应扩展注册到 instance 上，避免嵌套重试和刷新请求重复执行它。
    let result = instance.request<T>(config);
    const extension = interceptors?.response;
    if (extension?.onFulfilled) result = result.then(extension.onFulfilled);
    // 单独 catch 还能捕获 onFulfilled 中的业务校验失败，保持统一错误出口。
    if (extension?.onRejected) result = result.catch(extension.onRejected);
    return result.then((response) => response.data);
  };

  return {
    /**
     * 覆盖 createRequest 的默认认证适配器，整体替换，不合并方法。
     * 使用：request.configureAuth(customAdapter)，请在发出业务请求前完成配置。
     */
    configureAuth(adapter: RequestAuth) {
      auth = adapter;
    },
    get<T = unknown>(url: string, config?: RequestConfig) {
      return sendRequest<T>({...config, method: 'GET', url});
    },

    post<T = unknown>(url: string, data?: any, config?: RequestConfig) {
      return sendRequest<T>({...config, method: 'POST', url, data: data === undefined ? config?.data : data});
    },

    put<T = unknown>(url: string, data?: any, config?: RequestConfig) {
      return sendRequest<T>({...config, method: 'PUT', url, data: data === undefined ? config?.data : data});
    },

    delete<T = unknown>(url: string, config?: RequestConfig) {
      return sendRequest<T>({...config, method: 'DELETE', url});
    },
    patch<T = unknown>(url: string, data?: any, config?: RequestConfig) {
      return sendRequest<T>({...config, method: 'PATCH', url, data: data === undefined ? config?.data : data});
    },
  };
};

// 默认认证配置；需要区分环境时，直接在相应方法中判断即可。
export const request = createRequest({
  baseURL: '',
  authAdapter: {
    getAccessToken() {
      if (import.meta.env.DEV) {
        // 开发调试入口：可在这里添加日志、选择账号、读取测试凭证等操作。
        return localStorage.getItem(StorageKeys.token);
      }
      return localStorage.getItem(StorageKeys.accessToken);
    },
    async refreshToken(client) {
      const refreshToken = localStorage.getItem(StorageKeys.refreshToken);
      if (!refreshToken) throw new Error('缺少 refreshToken');

      // client 复用当前实例，并自动设置 skipAuth，避免刷新接口的 401 再触发刷新。
      // TODO：替换为实际刷新接口。此例约定返回 {code: 200, data: AuthTokens}。
      const response = await client.request<HttpResponse<AuthTokens>>({
        method: 'POST',
        url: '/auth/refresh',
        data: {refreshToken},
      });
      if (response.data.code !== 200) throw new Error('刷新接口业务失败');
      return response.data.data;
    },
    setTokens(tokens) {
      // 保存到读取时使用的 key，避免刷新成功后仍读到旧凭证。
      const tokenKey = import.meta.env.DEV ? StorageKeys.token : StorageKeys.accessToken;
      localStorage.setItem(tokenKey, tokens.accessToken);
      // 未返回新的 refreshToken 时，保留原值。
      if (tokens.refreshToken) localStorage.setItem(StorageKeys.refreshToken, tokens.refreshToken);
    },
    onRefreshError(error) {
      // 此例约定刷新 HTTP 401 表示凭证失效；断网、超时和 5xx 不清理凭证。
      if (!axios.isAxiosError(error)) return;
      if (error.response?.status !== 401) return;
      const tokenKey = import.meta.env.DEV ? StorageKeys.token : StorageKeys.accessToken;
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(StorageKeys.refreshToken);
      // TODO：接入项目实际的用户缓存清理、提示和登录页跳转。
    },
  },
  interceptors: {
    request: {
      onFulfilled(config) {
        config.headers.set('request-time', Date.now());
        return config;
      },
      onRejected: (error) => Promise.reject(error),
    },
    response: {
      onFulfilled(response) {
        const res = response.data;
        if (res.code !== 200 && res.code !== '0000') {
          return Promise.reject(res);
        }
        return response;
      },
      onRejected(error) {
        // HTTP、业务和刷新失败均经过这里；保持 reject，避免错误被当成成功。
        console.error('请求失败：', error);
        return Promise.reject(error);
      },
    },
  },
});

/**
 * 简单用法（在业务代码中调用，并捕获失败）：
 * await Promise.all([request.get('/users'), request.get('/profile')]);
 * await request.post('/auth/login', {username, password}, {skipAuth: true});
 * 登录成功后由调用方保存初始凭证：开发环境为 token / refreshToken，生产为 accessToken / refreshToken。
 * 如果自定义适配器的凭证存储方式，登录保存凭证的逻辑也需要同步调整。
 * 如需替换默认认证方式：request.configureAuth(customAdapter)。
 * 泛型表示完整响应体：request.get<HttpResponse<User>>('/users')。
 */
