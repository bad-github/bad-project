import type {SupabaseApiClient, AuthApi} from './types';

/**
 * 保留 SDK 完整认证能力和参数类型，包括密码、OTP、OAuth、SSO、MFA、会话及身份管理。
 * 返回原始 auth 对象，避免解构方法导致 SDK 的 this 丢失。
 * 各方法的中文用途见 types.ts 中的 AuthApi、AuthMfaApi、AuthAdminApi，编辑器悬浮时也会显示。
 * @example
 * const auth = createSupabaseApi(client).auth;
 * await auth.signUp({email, password, options: {data: {username}}});
 * await auth.signInWithPassword({email, password});
 * await auth.signInWithOtp({email, options: {shouldCreateUser: false}});
 * await auth.verifyOtp({email, token, type: 'email'});
 * await auth.signInWithOAuth({provider: 'github'});
 * await auth.resetPasswordForEmail(email, {redirectTo: resetUrl});
 * await auth.updateUser({password: newPassword});
 * await auth.signOut({scope: 'local'});
 * @example
 * const {data: {subscription}} = auth.onAuthStateChange((event, session) => {
 *   // 同步保存会话；避免在回调内等待其他 auth 方法。
 *   console.log(event, session?.user.id);
 * });
 * subscription.unsubscribe(); // 组件卸载时清理。
 */
export function createAuthApi(client: SupabaseApiClient): AuthApi {
  return client.auth;
}
