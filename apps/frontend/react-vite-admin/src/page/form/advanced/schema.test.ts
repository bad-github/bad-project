import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {createFormControl} from 'react-hook-form';
import * as api from './api';
import {createProfileResolver} from './schema';
import {createCompanyLogo} from './logo-model';
import type {ProfileValues} from './form-model';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function resolveApi<T>(request: Promise<T>): Promise<T> {
  await vi.runAllTimersAsync();
  return request;
}

describe('高级表单统一校验', () => {
  test('动态注册企业和密码字段不会同步通知观察区，异步校验状态仍正常更新', async () => {
    const profile = await resolveApi(api.getProfile());
    const form = createFormControl<ProfileValues>({defaultValues: profile, resolver: createProfileResolver()});
    let registering = false;
    let synchronousNotifications = 0;
    let validatingNotifications = 0;
    const unsubscribe = form.subscribe({
      formState: {isValid: true, isValidating: true, validatingFields: true},
      callback: ({isValidating}) => {
        if (registering) synchronousNotifications++;
        if (isValidating) validatingNotifications++;
      },
    });
    try {
      form.register('username');
      await vi.runAllTimersAsync();
      form.setValue('identity', 'company', {shouldDirty: true});
      registering = true;
      form.register('company.name', {value: ''});
      form.register('company.creditCode', {value: ''});
      form.register('company.logo', {value: null});
      form.register('security.password', {value: ''});
      form.register('security.confirmation', {value: ''});
      registering = false;
      expect(synchronousNotifications).toBe(0);
      expect(await resolveApi(form.trigger())).toBe(false);
      expect(form.getErrors('company.name')?.message).toBe('请填写企业名称');
      expect(validatingNotifications).toBeGreaterThan(0);
      form.setValue('identity', 'personal');
      form.unregister('company');
      expect(await resolveApi(form.trigger())).toBe(true);
    } finally {
      registering = false;
      unsubscribe();
    }
  });

  test('条件企业字段、Logo 和跨字段密码校验仍生效，隐藏字段不要求填写', async () => {
    const form = createFormControl<ProfileValues>({
      defaultValues: await resolveApi(api.getProfile()),
      resolver: createProfileResolver(),
    });
    const unsubscribe = form.subscribe({formState: {errors: true}, callback: () => {}});
    try {
      form.setValue('identity', 'company');
      form.setValue('company', {
        name: ' ',
        creditCode: 'invalid',
        logo: createCompanyLogo(new File(['gif'], 'brand.gif', {type: 'image/gif'})),
      });
      form.setValue('security', {changePassword: true, password: 'short', confirmation: 'different'});
      expect(await resolveApi(form.trigger())).toBe(false);
      expect(form.getErrors('company.name')?.message).toBeTruthy();
      expect(form.getErrors('company.creditCode')?.message).toBeTruthy();
      expect(form.getErrors('company.logo')?.message).toBe('Logo 仅支持 PNG 或 JPEG 图片');
      expect(form.getErrors('security.password')?.message).toBe('密码至少 8 位');
      expect(form.getErrors('security.confirmation')?.message).toBe('两次输入的密码不一致');
      form.setValue('company', {name: '示例企业', creditCode: '91330100123456789A', logo: null});
      form.setValue('security', {changePassword: true, password: 'secret123', confirmation: 'secret123'});
      expect(await resolveApi(form.trigger())).toBe(true);
      const file = new File(['png'], 'brand.png', {type: 'image/png'});
      form.setValue('company.logo', createCompanyLogo(file));
      let submittedFile: File | undefined;
      await resolveApi(
        form.handleSubmit((values) => {
          submittedFile = values.company?.logo?.file;
        })()
      );
      expect(submittedFile).toBe(file);
      form.setValue('identity', 'personal');
      form.setValue('security.changePassword', false);
      form.unregister(['company', 'security.password', 'security.confirmation']);
      expect(await resolveApi(form.trigger())).toBe(true);
    } finally {
      unsubscribe();
    }
  });

  test('resolver 校验邮箱不重复查重，用户名变化后重新检查占用', async () => {
    const check = vi.spyOn(api, 'checkUsername');
    const form = createFormControl<ProfileValues>({
      defaultValues: await resolveApi(api.getProfile()),
      resolver: createProfileResolver(),
    });
    form.register('username');
    form.register('email');
    const unsubscribe = form.subscribe({formState: {errors: true, isValid: true}, callback: () => {}});
    try {
      expect(await resolveApi(form.trigger())).toBe(true);
      expect(check).toHaveBeenCalledTimes(1);
      form.setValue('email', 'another@example.com');
      expect(await resolveApi(form.trigger('email'))).toBe(true);
      expect(check).toHaveBeenCalledTimes(1);
      form.setValue('username', 'admin');
      expect(await resolveApi(form.trigger('username'))).toBe(false);
      expect(form.getErrors('username')?.message).toBe('该用户名已被占用');
      expect(check).toHaveBeenCalledTimes(2);
    } finally {
      unsubscribe();
    }
  });
});
