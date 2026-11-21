import {time} from '@workspace/utils';
import {citiesByProvince, previewProfile, type ProfileValues, type SubmitScenario} from './form-model';
import {createCompanyLogo, validateCompanyLogo} from './logo-model';

/**
 * 本页所有异步边界集中在这里，组件不直接使用定时器伪造请求。
 * time.sleep(data, delay, rate) 的第三项是成功概率；固定为 1，错误由业务场景明确决定，
 * 避免教学页面偶发随机失败。这里只返回数据，不发送网络请求或持久化资料。
 */
const occupiedUsernames = new Set(['admin', 'test', 'root']);

export async function uploadCompanyLogo(file: File) {
  // 接口侧再次检查，不能只信任文件选择器 accept 或客户端的第一轮检查。
  const logo = createCompanyLogo(file);
  const valid = validateCompanyLogo(logo);
  if (valid !== true) throw new Error(valid);
  // Promise 完成前控件只显示 loading，不把新文件写进 RHF，也不生成它的预览 URL。
  return time.sleep<typeof logo>(logo, 1000, 1);
}

export async function getProfile(revision = 0): Promise<ProfileValues> {
  // revision 让手动刷新确实有新数据，便于观察“更新未编辑字段、保留编辑字段”的差别。
  return time.sleep<ProfileValues>(
    {
      username: revision ? `lin_updated_${revision}` : 'lin_react',
      email: revision ? `lin.updated${revision}@example.com` : 'lin@example.com',
      identity: 'personal',
      address: revision ? {province: '江苏', city: '苏州'} : {province: '浙江', city: '杭州'},
      security: {changePassword: false},
    },
    800,
    1
  );
}

export async function checkUsername(username: string): Promise<boolean> {
  return time.sleep<boolean>(!occupiedUsernames.has(username.trim().toLowerCase()), 600, 1);
}

export async function getCities(province: string): Promise<string[]> {
  // 返回新数组，防止调用方修改缓存中的选项；过期响应由调用方 effect 的 active 标记丢弃。
  return time.sleep<string[]>([...(citiesByProvince[province] ?? [])], 450, 1);
}

// 使用可辨别联合，调用方分别映射字段错误和 root.server，不靠解析一段提示字符串判断。
type SaveResult =
  | {ok: true; profile: ProfileValues; savedAt: string}
  | {ok: false; fieldErrors: Partial<Record<'username' | 'email', string>>; message?: never}
  | {ok: false; message: string; fieldErrors?: never};

/** 没有真实请求或持久化；所有失败由输入和场景决定，不使用随机失败。 */
export async function saveProfile(values: ProfileValues, scenario: SubmitScenario): Promise<SaveResult> {
  await time.sleep(null, 900, 1);
  // 最终保存独立检查占用，前端查重缓存/校验通过不能作为后端接受数据的保证。
  if (scenario === 'server-error') return {ok: false, message: '服务暂时不可用，请选择正常提交场景后重试。'};
  if (occupiedUsernames.has(values.username.trim().toLowerCase())) {
    return {ok: false, fieldErrors: {username: '该用户名已被占用'}};
  }
  if (scenario === 'email-conflict' || values.email.trim().toLowerCase() === 'used@example.com') {
    return {ok: false, fieldErrors: {email: '该邮箱已被注册，请更换邮箱并选择正常结果重试'}};
  }
  const profile: ProfileValues = {
    username: values.username.trim(),
    email: values.email.trim(),
    identity: values.identity,
    // 个人账户不回传企业残留；密码仅作为本次修改命令，不再放进保存后的资料基准。
    ...(values.identity === 'company' ? {company: {...values.company}} : {}),
    address: {...values.address},
    security: {changePassword: false},
  };
  return {ok: true, profile, savedAt: new Date().toLocaleTimeString('zh-CN', {hour12: false})};
}

export async function saveDraft(values: ProfileValues) {
  // 在等待之前就复制并脱敏，后续输入不能改变这份请求快照；草稿不包含原始密码和 File。
  const snapshot = previewProfile(values);
  return time.sleep<{values: ProfileValues; savedAt: string}>(
    {values: snapshot, savedAt: new Date().toLocaleTimeString('zh-CN', {hour12: false})},
    350,
    1
  );
}
