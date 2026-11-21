import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {createFormControl} from 'react-hook-form';
import {checkUsername, getCities, getProfile, saveDraft, saveProfile} from './api';
import * as api from './api';
import {errorMessages, previewProfile, validateCity, validateConfirmation} from './form-model';
import {createUsernameValidator} from './validation';

async function resolveApi<T>(request: Promise<T>): Promise<T> {
  await vi.runAllTimersAsync();
  return request;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('高级表单模拟接口', () => {
  test('加载与刷新返回不同的完整资料，城市数据彼此隔离', async () => {
    const initial = await resolveApi(getProfile());
    const refreshed = await resolveApi(getProfile(1));
    expect(initial.username).toBe('lin_react');
    expect(refreshed.username).toBe('lin_updated_1');
    expect(refreshed.address).toEqual({province: '江苏', city: '苏州'});
    const cities = await resolveApi(getCities('浙江'));
    cities.pop();
    expect(await resolveApi(getCities('浙江'))).toHaveLength(3);
    expect(await resolveApi(getCities('不存在'))).toEqual([]);
    expect(await resolveApi(checkUsername(' ADMIN '))).toBe(false);
  });

  test('保存区分字段冲突、全局失败与成功，成功资料不回传密码和隐藏企业字段', async () => {
    const profile = await resolveApi(getProfile());
    expect(await resolveApi(saveProfile(profile, 'email-conflict'))).toMatchObject({
      ok: false,
      fieldErrors: {email: expect.any(String)},
    });
    expect(await resolveApi(saveProfile({...profile, email: 'used@example.com'}, 'success'))).toMatchObject({
      ok: false,
      fieldErrors: {email: expect.any(String)},
    });
    expect(await resolveApi(saveProfile({...profile, username: 'admin'}, 'success'))).toMatchObject({
      ok: false,
      fieldErrors: {username: expect.any(String)},
    });
    expect(await resolveApi(saveProfile(profile, 'server-error'))).toMatchObject({
      ok: false,
      message: expect.any(String),
    });
    const result = await resolveApi(
      saveProfile(
        {
          ...profile,
          company: {name: '应移除'},
          security: {changePassword: true, password: 'secret123', confirmation: 'secret123'},
        },
        'success'
      )
    );
    expect(result).toMatchObject({ok: true, profile: {security: {changePassword: false}}});
    if (result.ok) {
      expect(result.profile.company).toBeUndefined();
      expect(result.profile.security.password).toBeUndefined();
    }
  });

  test('并发用户名校验等待最新结果，旧输入的占用结果不会覆盖新输入', async () => {
    let current = 'admin';
    const validate = createUsernameValidator(() => current);
    const oldRequest = validate(current);
    current = 'available_user';
    const latestRequest = validate(current);
    expect(await resolveApi(Promise.all([oldRequest, latestRequest]))).toEqual([true, true]);

    const validRequest = validate(current);
    current = 'test';
    const invalidRequest = validate(current);
    expect(await resolveApi(Promise.all([validRequest, invalidRequest]))).toEqual([
      '该用户名已被占用',
      '该用户名已被占用',
    ]);

    const staleRequest = validate(current);
    current = 'typing_user'; // 修改后尚未失焦，不展示旧输入错误。
    expect(await resolveApi(staleRequest)).toBe(true);
    current = 'ab';
    expect(await validate(current)).toContain('4–20');
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('高级表单数据与 RHF', () => {
  test('订阅 isValid 后校验其他字段复用用户名结果，修改用户名才重新查重', async () => {
    const check = vi.spyOn(api, 'checkUsername');
    const form = createFormControl({defaultValues: {username: 'available_user', email: 'lin@example.com'}});
    const validate = createUsernameValidator(() => form.getValues('username'));
    form.register('username', {validate});
    form.register('email', {required: '请填写邮箱'});
    const unsubscribe = form.subscribe({
      formState: {isValid: true, isValidating: true, validatingFields: true},
      callback: () => {},
    });
    try {
      expect(await resolveApi(form.trigger('username'))).toBe(true);
      expect(check).toHaveBeenCalledTimes(1);
      for (const email of ['first@example.com', 'second@example.com']) {
        form.setValue('email', email, {shouldValidate: true});
        await vi.runAllTimersAsync();
        expect(await resolveApi(form.trigger('email'))).toBe(true);
      }
      expect(check).toHaveBeenCalledTimes(1);
      form.setValue('username', 'another_user');
      expect(await resolveApi(form.trigger('username'))).toBe(true);
      expect(check).toHaveBeenCalledTimes(2);
    } finally {
      unsubscribe();
    }
  });

  test('同值并发查重合并请求，请求失败不会永久缓存失败结果', async () => {
    const check = vi.spyOn(api, 'checkUsername');
    const validate = createUsernameValidator(() => 'available_user');
    expect(await resolveApi(Promise.all([validate('available_user'), validate('available_user')]))).toEqual([
      true,
      true,
    ]);
    expect(check).toHaveBeenCalledTimes(1);
    check.mockRejectedValueOnce(new Error('查重失败'));
    const retryValidate = createUsernameValidator(() => 'retry_user');
    expect(await retryValidate('retry_user')).toBe('查重失败，请重试');
    expect(await resolveApi(retryValidate('retry_user'))).toBe(true);
    expect(check).toHaveBeenCalledTimes(3);
  });

  test('刷新保留 dirty 字段，其他字段与默认值同步，完整重置丢弃本地修改', async () => {
    const initial = await resolveApi(getProfile());
    const remote = await resolveApi(getProfile(1));
    const form = createFormControl({defaultValues: initial});
    const unsubscribe = form.subscribe({formState: {dirtyFields: true, isDirty: true}, callback: () => {}});
    try {
      form.register('email');
      form.register('username');
      form.register('address.province');
      form.register('address.city');
      form.setValue('email', 'local@example.com', {shouldDirty: true});
      form.reset(remote, {keepDirtyValues: true});
      expect(form.getValues('email')).toBe('local@example.com');
      expect(form.getValues('username')).toBe(remote.username);
      expect(form.getValues('address')).toEqual(remote.address);
      expect(form.getFieldState('email').isDirty).toBe(true);
      form.reset();
      expect(form.getValues()).toEqual(remote);
      expect(form.getFieldState('email').isDirty).toBe(false);
    } finally {
      unsubscribe();
    }
  });

  test('省市和密码跨字段校验，注销字段移除旧值和错误', async () => {
    const profile = await resolveApi(getProfile());
    expect(validateCity('杭州', profile)).toBe(true);
    expect(validateCity('苏州', profile)).toBe('请选择当前省份下的城市');
    const values = {
      ...profile,
      identity: 'company' as const,
      company: {name: ''},
      security: {changePassword: true, password: 'secret123', confirmation: 'different'},
    };
    expect(validateConfirmation('different', values)).toBe('两次输入的密码不一致');
    expect(validateConfirmation('secret123', values)).toBe(true);
    const form = createFormControl({defaultValues: values});
    form.register('company.name', {required: '请填写企业名称'});
    form.register('security.confirmation', {validate: validateConfirmation});
    const unsubscribe = form.subscribe({formState: {errors: true}, callback: () => {}});
    try {
      expect(await form.trigger(['company.name', 'security.confirmation'])).toBe(false);
      form.unregister(['company', 'security.password', 'security.confirmation']);
      expect(form.getValues('company')).toBeUndefined();
      expect(form.getValues('security')).toEqual({changePassword: true});
      expect(form.getErrors()).toEqual({});
    } finally {
      unsubscribe();
    }
  });

  test('观察和草稿脱敏并复制嵌套值，错误快照不保留 DOM 引用', async () => {
    const profile = await resolveApi(getProfile());
    profile.security = {changePassword: true, password: 'secret123', confirmation: 'secret123'};
    const preview = previewProfile(profile);
    profile.address.city = '宁波';
    expect(preview.address.city).toBe('杭州');
    expect(preview.security.password).toBe('已填写（9 位）');
    const draftRequest = saveDraft(profile);
    profile.security.password = 'changed';
    const draft = await resolveApi(draftRequest);
    expect(draft.values.security.password).toBe('已填写（9 位）');
    const ref: {self?: unknown} = {};
    ref.self = ref;
    expect(
      errorMessages({address: {city: {message: '请选择城市', ref}}, root: {server: {message: '服务异常'}}})
    ).toEqual({'address.city': '请选择城市', 'root.server': '服务异常'});
  });
});
