import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import type {Resolver} from 'react-hook-form';
import {
  citiesByProvince,
  validateCity,
  validateConfirmation,
  validateUsernameFormat,
  type ProfileValues,
} from './form-model';
import {validateCompanyLogo, type CompanyLogo} from './logo-model';
import {createUsernameValidator} from './validation';

/**
 * zodResolver 将 Zod 的 path/message 转换为 RHF 的嵌套 errors，并返回通过校验的数据。
 * 使用异步 superRefine，不能将 resolver 配置成同步模式；否则无法等待用户名接口。
 *
 * 此页统一使用 resolver，组件中的 register/Controller 只接值和事件。
 * 当前 RHF 的内置异步字段校验可能在动态 register 时同步通知 isValidating，导致跨组件
 * 渲染更新警告；resolver 路径会延后注册触发的有效性检查，避免这一问题。
 */
export function createProfileResolver(): Resolver<ProfileValues> {
  // 每次 resolver 调用都更新当前名字，用于并发校验的旧结果检查；不放进 React 状态。
  let currentUsername = '';
  const checkUsername = createUsernameValidator(() => currentUsername);
  const schema = z
    .object({
      username: z.string({required_error: '请填写用户名'}),
      email: z.string({required_error: '请填写邮箱'}).min(1, '请填写邮箱').email('请输入有效的邮箱地址'),
      identity: z.enum(['personal', 'company']),
      // 条件字段必须先允许缺席，否则个人身份也会被基础结构校验拦住。
      // “企业时必填”放到 superRefine，不能在这里无条件写 name.min(1)。
      company: z
        .object({
          name: z.string().optional(),
          creditCode: z.string().optional(),
          // 保留 File/已有 URL 的业务对象，具体类型、大小由共享 Logo 校验器检查。
          logo: z.custom<CompanyLogo | null>().optional(),
        })
        .optional(),
      address: z.object({
        province: z
          .string({required_error: '请选择省份'})
          .refine((value) => Object.hasOwn(citiesByProvince, value), '请选择省份'),
        city: z.string({required_error: '请选择城市'}),
      }),
      security: z.object({
        changePassword: z.boolean(),
        password: z.string().optional(),
        confirmation: z.string().optional(),
      }),
    })
    .superRefine(async (values, context) => {
      // 精确 path 决定错误落到哪个 FormField；只返回根消息无法在具体控件下显示。
      const addError = (path: (string | number)[], message: string) =>
        context.addIssue({code: 'custom', path, message});
      // 城市必须属于当前省份，即使 UI 已清空联动字段，也要防守程序赋值/刷新残留。
      const city = validateCity(values.address.city, values);
      if (city !== true) addError(['address', 'city'], city);
      if (values.identity === 'company') {
        if (!values.company?.name?.trim()) addError(['company', 'name'], '请填写企业名称');
        if (!values.company?.creditCode) addError(['company', 'creditCode'], '请填写统一社会信用代码');
        else if (!/^[0-9A-HJ-NPQRTUWXY]{18}$/.test(values.company.creditCode))
          addError(['company', 'creditCode'], '请输入 18 位大写统一社会信用代码');
        const logo = validateCompanyLogo(values.company?.logo);
        if (logo !== true) addError(['company', 'logo'], logo);
      }
      // 关闭修改密码后，两个字段会注销；此时 schema 不能继续要求它们有值。
      if (values.security.changePassword) {
        if (!values.security.password) addError(['security', 'password'], '请输入新密码');
        else if (values.security.password.length < 8) addError(['security', 'password'], '密码至少 8 位');
        const confirmation = validateConfirmation(values.security.confirmation, values);
        if (confirmation !== true) addError(['security', 'confirmation'], confirmation);
      }
      // 先做廉价格式检查，再请求接口。订阅 isValid、trigger('email') 等都可能执行整个
      // schema，所以 checkUsername 内必须复用同一用户名的结果，避免重复网络等待。
      const format = validateUsernameFormat(values.username);
      const username = format === true ? await checkUsername(values.username) : format;
      if (username !== true) addError(['username'], username);
    });
  const resolve = zodResolver(schema);
  // 原样转交 resolver options，保留 RHF 的字段范围、ref 和原生校验等适配信息。
  // trigger('username') 的目标是用户名；resolver 本身仍可能运行整份 schema。
  return (values, context, options) => {
    currentUsername = values.username;
    return resolve(values, context, options);
  };
}
