import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {createFormControl} from 'react-hook-form';
import {getProfile} from './api';
import {resetProfile} from './form-actions';
import {createProfileResolver} from './schema';
import type {ProfileValues} from './form-model';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

async function resolveApi<T>(request: Promise<T>): Promise<T> {
  await vi.runAllTimersAsync();
  return request;
}

function createMountedForm(values: ProfileValues) {
  const form = createFormControl<ProfileValues>({
    defaultValues: values,
    shouldUnregister: true,
    resolver: createProfileResolver(),
  });
  const unsubscribe = form.subscribe({
    formState: {isValid: true, errors: true, dirtyFields: true, isDirty: true},
    callback: () => {},
  });
  // 与页面个人身份下实际挂载的字段保持一致，包括普通输入和受控控件。
  for (const name of [
    'username',
    'email',
    'identity',
    'address.province',
    'address.city',
    'security.changePassword',
  ] as const)
    form.register(name);
  return {form, unsubscribe};
}

describe('刷新、重置与注销字段的组合', () => {
  test.each([true, false])('未编辑字段，keepDirtyValues=%s 刷新后可直接保存，无需重新输入', async (keepDirtyValues) => {
    const initial = await resolveApi(getProfile());
    const remote = await resolveApi(getProfile(1));
    const {form, unsubscribe} = createMountedForm(initial);
    try {
      await vi.runAllTimersAsync();
      resetProfile(form, remote, {keepDirtyValues});
      expect(form.getValues()).toEqual(remote);
      let submitted: ProfileValues | undefined;
      await resolveApi(
        form.handleSubmit((values) => {
          submitted = values;
        })()
      );
      expect(submitted).toEqual(remote);
      expect(form.getErrors()).toEqual({});
    } finally {
      unsubscribe();
    }
  });

  test('刷新保留修改后可提交，重置本地修改和保存后再次回填也保留完整值', async () => {
    const initial = await resolveApi(getProfile());
    const remote = await resolveApi(getProfile(1));
    const {form, unsubscribe} = createMountedForm(initial);
    try {
      await vi.runAllTimersAsync();
      form.setValue('email', 'local@example.com', {shouldDirty: true});
      resetProfile(form, remote, {keepDirtyValues: true});
      expect(form.getValues()).toEqual({...remote, email: 'local@example.com'});
      expect(form.getFieldState('email').isDirty).toBe(true);
      expect(await resolveApi(form.trigger())).toBe(true);

      resetProfile(form);
      // 页面重新渲染时仍会注册字段；保证即刻读取和提交都正常。
      for (const name of [
        'username',
        'email',
        'identity',
        'address.province',
        'address.city',
        'security.changePassword',
      ] as const)
        form.register(name);
      expect(form.getValues()).toEqual(remote);
      expect(await resolveApi(form.trigger())).toBe(true);
      expect(form.getFieldState('email').isDirty).toBe(false);

      resetProfile(form, {...remote, username: 'saved_user'}, {keepIsSubmitted: true, keepSubmitCount: true});
      expect(form.getValues('username')).toBe('saved_user');
      expect(await resolveApi(form.trigger())).toBe(true);
    } finally {
      unsubscribe();
    }
  });
});
