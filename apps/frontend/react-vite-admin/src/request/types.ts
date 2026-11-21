import type {AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig} from 'axios';

export type HttpResponse<T = any> = {
  code: number;
  message: string;
  data: T;
};

/** 登录等公共接口设置 skipAuth: true，不自动加 token，也不自动刷新。 */
export type RequestConfig = AxiosRequestConfig & {skipAuth?: boolean};

/** 后端轮换 refreshToken 时，与 accessToken 一起保存。 */
export type AuthTokens = {accessToken: string; refreshToken?: string};

/** 刷新入口，使用 Axios 原生 request 签名；共用业务实例并自动设置 skipAuth。 */
export type RefreshClient = Pick<AxiosInstance, 'request'>;

/** 外部接入点：实际刷新地址、请求参数和凭证存储由调用方实现。 */
export type RequestAuth = {
  /** 每次请求和重试都读取最新 accessToken。 */
  getAccessToken: () => string | null;
  /** 使用传入的 client.request 刷新，自动跳过认证恢复，避免递归刷新。 */
  refreshToken: (client: RefreshClient) => Promise<AuthTokens>;
  /** 同步保存凭证，保存完成后才重试等待的请求。 */
  setTokens: (tokens: AuthTokens) => void;
  /**
   * 可选：每次共享刷新失败只通知一次；清理登录状态、提示或跳转在外部实现。
   * 超时、断网也会进入这里，调用方应根据错误判断是否需要退出登录。
   */
  onRefreshError?: (error: unknown) => void;
};

export type AuthRequestConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean;
  /** 中间层内部标记：原请求是否已因 401 重试过，防止无限刷新。 */
  _authRetried?: boolean;
  /** 本次发送使用的凭证版本，判断收到 401 时是否已有其他请求刷新成功。 */
  _tokenVersion?: number;
};

// 直接从 Axios 的 use 方法提取参数类型，支持异步回调及原生 request options。
type RequestInterceptorArgs = Parameters<AxiosInstance['interceptors']['request']['use']>;
type ResponseInterceptorArgs = Parameters<AxiosInstance['interceptors']['response']['use']>;

export type CreateRequestOptions = AxiosRequestConfig & {
  /** 默认认证适配器；configureAuth 可以整体覆盖它。 */
  authAdapter?: RequestAuth;
  /** 扩展内部行为：请求扩展先于认证执行，响应扩展在 401 恢复之后执行。 */
  interceptors?: {
    request?: {
      /** 返回请求配置，支持异步；原请求重试时也会执行。 */
      onFulfilled?: RequestInterceptorArgs[0];
      onRejected?: RequestInterceptorArgs[1];
      /** Axios 原生请求拦截器选项，如 runWhen、synchronous。 */
      options?: RequestInterceptorArgs[2];
    };
    response?: {
      /** 返回完整 AxiosResponse，最后由封装统一解包 data。 */
      onFulfilled?: ResponseInterceptorArgs[0];
      /** HTTP、刷新和业务校验错误统一进入此处；抛错/reject 保持失败。 */
      onRejected?: ResponseInterceptorArgs[1];
    };
  };
};
