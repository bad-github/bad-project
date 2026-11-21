import {previewCompanyLogo, type CompanyLogo} from './logo-model';
import type {DeepPartial} from 'react-hook-form';

/**
 * 点路径 address.city/security.password 对应嵌套业务对象，而非扁平字符串键。
 * company 与密码字段是可选的，因为 shouldUnregister 会在它们隐藏时移除值。
 * Logo 的 null 表示主动删除，undefined 表示该字段尚不存在/已被注销。
 */
export type ProfileValues = {
  username: string;
  email: string;
  identity: 'personal' | 'company';
  company?: {name?: string; creditCode?: string; logo?: CompanyLogo | null};
  address: {province: string; city: string};
  security: {changePassword: boolean; password?: string; confirmation?: string};
};

// 场景只控制接口返回，不注册进 RHF，因此切换场景不会影响表单 dirty 或提交载荷。
export type SubmitScenario = 'success' | 'email-conflict' | 'server-error';

export const citiesByProvince: Record<string, string[]> = {
  浙江: ['杭州', '宁波', '温州'],
  江苏: ['南京', '苏州', '无锡'],
  广东: ['广州', '深圳', '珠海'],
};

export function createEmptyValues(): ProfileValues {
  return {
    username: '',
    email: '',
    identity: 'personal',
    address: {province: '', city: ''},
    security: {changePassword: false},
  };
}

export function validateUsernameFormat(value: string): true | string {
  return /^[a-zA-Z][a-zA-Z0-9_]{3,19}$/.test(value) || '请输入 4–20 位字母、数字或下划线，以字母开头';
}

export function validateCity(value: string, values: ProfileValues): true | string {
  // 联动 UI 的清空不能替代业务校验，刷新保留修改等操作仍可能组合出不匹配的省市。
  return Boolean(citiesByProvince[values.address.province]?.includes(value)) || '请选择当前省份下的城市';
}

export function validateConfirmation(value: string | undefined, values: ProfileValues): true | string {
  // 关闭改密时直接通过，不能要求已经注销的确认密码继续存在。
  return (
    !values.security.changePassword || (Boolean(value) && value === values.security.password) || '两次输入的密码不一致'
  );
}

/**
 * 仅供观察/快照/草稿展示，不可拿这个结果 reset 回真实表单（密码已被替换，File 已移除）。
 * 接受 DeepPartial 是因为异步初值和动态字段挂载期间，useWatch/defaultValues 可以不完整。
 * 显式补展示空值并复制嵌套对象，避免读取快照后又随原对象变化，也避免输出二进制内容。
 */
export function previewProfile(values: DeepPartial<ProfileValues>): ProfileValues {
  const mask = (value: string | undefined) => (value ? `已填写（${value.length} 位）` : value);
  return {
    username: values.username ?? '',
    email: values.email ?? '',
    identity: values.identity ?? 'personal',
    ...(values.company
      ? {
          company: {
            name: values.company.name,
            creditCode: values.company.creditCode,
            ...(values.company.logo
              ? {logo: previewCompanyLogo(values.company.logo)}
              : values.company.logo === null
                ? {logo: null}
                : {}),
          },
        }
      : {}),
    address: {province: values.address?.province ?? '', city: values.address?.city ?? ''},
    security: {
      changePassword: values.security?.changePassword ?? false,
      password: mask(values.security?.password),
      confirmation: mask(values.security?.confirmation),
    },
  };
}

/** 将嵌套 FieldErrors 变成路径→消息；只用于展示，不会调用 clearErrors 或改变 RHF 状态。 */
export function errorMessages(errors: unknown, prefix = ''): Record<string, string> {
  if (!errors || typeof errors !== 'object') return {};
  if ('message' in errors && typeof errors.message === 'string') return {[prefix]: errors.message};
  return Object.fromEntries(
    Object.entries(errors).flatMap(([key, value]) =>
      // ref 可能是 DOM/句柄甚至含循环引用，不能递归序列化；这里只需要消息。
      ['ref', 'type', 'types'].includes(key)
        ? []
        : Object.entries(errorMessages(value, prefix ? `${prefix}.${key}` : key))
    )
  );
}
