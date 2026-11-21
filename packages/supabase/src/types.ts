import type {
  PostgrestSingleResponse,
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  SupabaseClient,
} from '@supabase/supabase-js';

/** 只约束 SDK 公共能力，避免将客户端固定为 public schema。 */
export type SupabaseApiClient = Pick<
  SupabaseClient,
  | 'auth'
  | 'storage'
  | 'realtime'
  | 'functions'
  | 'from'
  | 'schema'
  | 'rpc'
  | 'channel'
  | 'getChannels'
  | 'removeChannel'
  | 'removeAllChannels'
>;

// 常用 SDK 类型显式转出，避免声明打包器把 type-only 通配导出变成运行时通配导出。
export type {
  SupabaseClient,
  SupabaseClientOptions,
  Session,
  User,
  AuthChangeEvent,
  Provider,
  SignUpWithPasswordCredentials,
  SignInWithPasswordCredentials,
  SignInWithPasswordlessCredentials,
  SignInWithOAuthCredentials,
  UserAttributes,
  PostgrestSingleResponse,
  PostgrestResponse,
  QueryData,
  QueryResult,
  QueryError,
  RealtimeChannel,
  RealtimeChannelOptions,
  RealtimePostgresChangesPayload,
  RealtimePresenceState,
  FunctionInvokeOptions,
} from '@supabase/supabase-js';

export interface PaginationOptions {
  /** 页码从 1 开始。 */
  page?: number;
  /** 每页条数，默认 20。 */
  pageSize?: number;
}
export interface PageRange {
  page: number;
  pageSize: number;
  from: number;
  /** Supabase range 的结束位置包含在结果中。 */
  to: number;
}
export interface PaginationMeta {
  page: number;
  pageSize: number;
  /** 查询没有请求 count 时返回 null，避免把未知总数当作 0。 */
  totalPages: number | null;
  hasNextPage: boolean | null;
}
export type PageResult<Row> = PostgrestSingleResponse<Row[]> & PaginationMeta;
export interface PageQuery<Row> {
  range(from: number, to: number): PromiseLike<PostgrestSingleResponse<Row[]>>;
}
export interface IteratePagesOptions extends PaginationOptions {
  /** 可选读取上限；达到上限后结束迭代，不再发起请求。 */
  maxPages?: number;
}
export type StorageBucket = ReturnType<SupabaseClient['storage']['from']>;
export type SubscribeStatusCallback = Parameters<RealtimeChannel['subscribe']>[0];
export interface TableSubscriptionOptions {
  table: string;
  schema?: string;
  filter?: string;
  /** 默认生成独立频道名；显式传入同名频道时需由调用方管理复用。 */
  channelName?: string;
}
export interface ManagedSubscription {
  channel: RealtimeChannel;
  /** 移除频道；重复调用复用同一次清理任务。 */
  unsubscribe: () => ReturnType<SupabaseClient['removeChannel']>;
}
export type TableChangeHandler<Row extends Record<string, unknown>> = (
  payload: RealtimePostgresChangesPayload<Row>
) => void;
export interface ProfileListOptions extends PaginationOptions {
  columns?: string;
  orderBy?: string;
  ascending?: boolean;
  email?: string;
  signal?: AbortSignal;
}
export interface DataResult<T> {
  data: T;
  error: unknown | null;
}

// 以下接口只补充中文方法说明；实际签名仍引用 SDK，运行时仍返回原始对象。
type NativeAuthApi = SupabaseApiClient['auth'];
type NativeAuthAdminApi = NativeAuthApi['admin'];
type NativeAuthMfaApi = NativeAuthApi['mfa'];
type NativeFunctionsApi = SupabaseApiClient['functions'];

/** 认证账户管理 API，仅在持有管理员权限的服务端客户端使用。 */
export interface AuthAdminApi extends NativeAuthAdminApi {
  /** 分页读取认证账户列表，参数为 page、perPage；不是读取 profiles 表。 */
  listUsers: NativeAuthAdminApi['listUsers'];
  /** 按认证用户 ID 查询账户信息，不读取业务资料表。 */
  getUserById: NativeAuthAdminApi['getUserById'];
  /** 直接创建认证账户，可配置密码、元数据及是否已确认邮箱或手机号。 */
  createUser: NativeAuthAdminApi['createUser'];
  /** 修改指定认证账户的邮箱、密码、元数据或其他管理员属性。 */
  updateUserById: NativeAuthAdminApi['updateUserById'];
  /** 删除指定认证账户；业务表关联数据如何处理由数据库外键和触发器决定。 */
  deleteUser: NativeAuthAdminApi['deleteUser'];
  /** 向指定邮箱发送账户邀请邮件，可附带元数据和回跳地址。 */
  inviteUserByEmail: NativeAuthAdminApi['inviteUserByEmail'];
  /** 生成注册、邀请、免密码或密码恢复链接，供自定义邮件流程使用；该方法不负责发邮件。 */
  generateLink: NativeAuthAdminApi['generateLink'];
  /** 按用户 JWT 撤销指定范围的认证会话，适用于管理员使用户退出的场景。 */
  signOut: NativeAuthAdminApi['signOut'];
}

/** 当前用户的多因素认证 API。 */
export interface AuthMfaApi extends NativeAuthMfaApi {
  /** 列出当前用户的多因素认证设备及其验证状态。 */
  listFactors: NativeAuthMfaApi['listFactors'];
  /** 获取当前会话及可达到的认证强度，用于判断是否需要二次验证。 */
  getAuthenticatorAssuranceLevel: NativeAuthMfaApi['getAuthenticatorAssuranceLevel'];
  /** 登记新的 MFA 因子，例如 TOTP 验证器；登记后还需完成 challenge/verify 验证。 */
  enroll: NativeAuthMfaApi['enroll'];
  /** 为已登记的 MFA 因子创建一次验证挑战，返回后续 verify 所需的 challengeId。 */
  challenge: NativeAuthMfaApi['challenge'];
  /** 提交 factorId、challengeId 和验证码，完成 MFA 验证。 */
  verify: NativeAuthMfaApi['verify'];
  /** 将创建挑战与提交验证码合并，适用于已知 factorId 的便捷验证流程。 */
  challengeAndVerify: NativeAuthMfaApi['challengeAndVerify'];
  /** 解除指定 MFA 因子的绑定。 */
  unenroll: NativeAuthMfaApi['unenroll'];
}

/** 完整保留 SDK 认证能力，并为常用方法提供中文编辑器提示。 */
export interface AuthApi extends NativeAuthApi {
  /** 注册邮箱或手机号账户；是否需要确认、是否立即获得会话由项目认证配置决定。 */
  signUp: NativeAuthApi['signUp'];
  /** 使用邮箱或手机号及密码登录，返回用户、会话或认证错误。 */
  signInWithPassword: NativeAuthApi['signInWithPassword'];
  /** 向邮箱或手机号发送免密码登录凭证；邮件可能为 Magic Link 或验证码，取决于邮件模板。 */
  signInWithOtp: NativeAuthApi['signInWithOtp'];
  /** 校验邮件或短信验证码，按 type 完成登录、注册确认或其他验证流程。 */
  verifyOtp: NativeAuthApi['verifyOtp'];
  /** 发起 GitHub 等第三方 OAuth 登录；浏览器默认会跳转到提供商授权页面。 */
  signInWithOAuth: NativeAuthApi['signInWithOAuth'];
  /** 使用受支持身份提供商签发的 ID Token 登录，例如已有 Google 登录凭证的场景。 */
  signInWithIdToken: NativeAuthApi['signInWithIdToken'];
  /** 通过企业域名或提供商 ID 发起 SSO 单点登录。 */
  signInWithSSO: NativeAuthApi['signInWithSSO'];
  /** 创建匿名认证用户并登录，适用于访客会话；不同于未登录的匿名数据库访问。 */
  signInAnonymously: NativeAuthApi['signInAnonymously'];
  /** 按 scope 退出会话：global 为全部会话，local 为当前会话，others 为其他会话并保留当前会话。 */
  signOut: NativeAuthApi['signOut'];
  /** 向邮箱发送密码重置邮件；redirectTo 指定恢复流程的回跳地址。 */
  resetPasswordForEmail: NativeAuthApi['resetPasswordForEmail'];
  /** 修改当前认证用户的密码、邮箱、手机号或用户元数据；不更新 profiles 业务表。 */
  updateUser: NativeAuthApi['updateUser'];
  /** 读取当前会话，必要时刷新过期会话；本地保存的会话不能直接作为服务端鉴权依据。 */
  getSession: NativeAuthApi['getSession'];
  /** 向认证服务查询并验证当前用户，也可传入 JWT 获取其对应用户。 */
  getUser: NativeAuthApi['getUser'];
  /** 校验 JWT 并读取声明；验证方式由项目签名算法和 SDK 配置决定。 */
  getClaims: NativeAuthApi['getClaims'];
  /** 使用刷新令牌换取新的访问令牌和会话；可传入指定的 refresh_token。 */
  refreshSession: NativeAuthApi['refreshSession'];
  /** 用 access_token 和 refresh_token 设置当前会话；访问令牌过期时 SDK 会尝试刷新。 */
  setSession: NativeAuthApi['setSession'];
  /** 将 PKCE 登录回调中的授权码换成会话，适用于 OAuth 或邮件登录回跳处理。 */
  exchangeCodeForSession: NativeAuthApi['exchangeCodeForSession'];
  /** 监听登录、退出、令牌刷新等事件；返回 subscription，卸载时调用 unsubscribe 清理。 */
  onAuthStateChange: NativeAuthApi['onAuthStateChange'];
  /** 重新发送注册确认、邮箱变更或短信等验证消息；type 指定验证场景。 */
  resend: NativeAuthApi['resend'];
  /** 请求当前用户重新验证身份，常用于启用安全密码更新后的再次身份确认。 */
  reauthenticate: NativeAuthApi['reauthenticate'];
  /** 获取当前用户绑定的登录身份，例如邮箱、GitHub、Google。 */
  getUserIdentities: NativeAuthApi['getUserIdentities'];
  /** 为当前登录用户绑定第三方登录身份，OAuth 流程可能触发页面跳转。 */
  linkIdentity: NativeAuthApi['linkIdentity'];
  /** 解除指定登录身份的绑定，能否解绑由认证服务的身份规则决定。 */
  unlinkIdentity: NativeAuthApi['unlinkIdentity'];
  /** 启动会话令牌自动刷新，常用于需要手动管理应用前后台状态的运行环境。 */
  startAutoRefresh: NativeAuthApi['startAutoRefresh'];
  /** 停止自动刷新；不会主动退出登录或删除会话。 */
  stopAutoRefresh: NativeAuthApi['stopAutoRefresh'];
  /** 管理认证账户；需要服务端管理员权限，不用于浏览器普通用户操作。 */
  admin: AuthAdminApi;
  /** 登记验证器、提交二次验证码、读取认证强度等多因素认证操作。 */
  mfa: AuthMfaApi;
}

/** Edge Functions 调用入口，保持 SDK 的返回泛型和选项。 */
export interface FunctionsApi extends NativeFunctionsApi {
  /**
   * 调用已部署的 Edge Function，name 为函数名，options 支持 body、headers、region 等。
   * 返回 {data, error}；响应类型由泛型指定，运行时数据校验由应用负责。
   * @example await api.functions.invoke<{ok: boolean}>('hello', {body: {name: 'Alice'}});
   */
  invoke: NativeFunctionsApi['invoke'];
  /** 设置后续函数请求使用的 Bearer Token；普通会话场景通常由客户端自动提供令牌。 */
  setAuth: NativeFunctionsApi['setAuth'];
}
