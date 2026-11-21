import {afterEach, describe, expect, test, vi} from 'vitest';
import {createFormControl} from 'react-hook-form';
import {saveProfile, uploadCompanyLogo} from './api';
import {createEmptyValues, previewProfile, type ProfileValues} from './form-model';
import {createCompanyLogo, MAX_LOGO_SIZE, validateCompanyLogo, type CompanyLogo} from './logo-model';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const existingLogo: CompanyLogo = {
  id: 'existing-logo',
  name: 'brand.png',
  type: 'image/png',
  size: 1024,
  url: '/brand.png',
};

function enterpriseProfile(): ProfileValues {
  return {
    ...createEmptyValues(),
    username: 'logo_user',
    email: 'logo@example.com',
    identity: 'company',
    company: {name: '示例企业', logo: {...existingLogo}},
  };
}

describe('企业 Logo 控件数据契约', () => {
  test('上传等待 1 秒后才返回文件，完成前没有可提交的新 Logo', async () => {
    vi.useFakeTimers();
    const file = new File(['png'], 'brand.png', {type: 'image/png'});
    let completed = false;
    const request = uploadCompanyLogo(file).then((logo) => {
      completed = true;
      return logo;
    });
    expect(completed).toBe(false);
    await vi.advanceTimersByTimeAsync(999);
    expect(completed).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    const logo = await request;
    expect(completed).toBe(true);
    expect(logo.file).toBe(file);
    expect(logo.name).toBe('brand.png');
  });

  test('上传接口拒绝非法文件，不进入异步等待', async () => {
    vi.useFakeTimers();
    await expect(uploadCompanyLogo(new File(['gif'], 'brand.gif', {type: 'image/gif'}))).rejects.toThrow(
      'Logo 仅支持 PNG 或 JPEG 图片'
    );
    expect(vi.getTimerCount()).toBe(0);
  });
  test('没有 crypto 或 randomUUID 时仍可生成同一毫秒内不重复的页面标识', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const file = new File(['png'], 'logo.png', {type: 'image/png'});
    const ids: string[] = [];
    for (const crypto of [undefined, {}]) {
      vi.stubGlobal('crypto', crypto);
      for (let index = 0; index < 20; index++) ids.push(createCompanyLogo(file).id);
    }
    expect(new Set(ids).size).toBe(40);
  });
  test('只接受非空 PNG/JPEG，最大 2MB，允许选填和删除', () => {
    expect(validateCompanyLogo(null)).toBe(true);
    expect(validateCompanyLogo(undefined)).toBe(true);
    expect(validateCompanyLogo(existingLogo)).toBe(true);
    for (const type of ['image/png', 'image/jpeg']) {
      expect(validateCompanyLogo(createCompanyLogo(new File([new Uint8Array(MAX_LOGO_SIZE)], 'logo', {type})))).toBe(
        true
      );
    }
    expect(validateCompanyLogo(createCompanyLogo(new File(['gif'], 'logo.gif', {type: 'image/gif'})))).toBe(
      'Logo 仅支持 PNG 或 JPEG 图片'
    );
    expect(validateCompanyLogo(createCompanyLogo(new File([], 'logo.png', {type: 'image/png'})))).toBe(
      '图片内容为空，请重新选择'
    );
    expect(
      validateCompanyLogo(
        createCompanyLogo(new File([new Uint8Array(MAX_LOGO_SIZE + 1)], 'logo.png', {type: 'image/png'}))
      )
    ).toBe('Logo 图片大小不能超过 2MB');
    expect(validateCompanyLogo({...existingLogo, url: undefined})).toBe('图片已失效，请重新选择');
  });

  test('同名同尺寸文件仍可区分，实际 File 元数据用于校验', () => {
    const file = new File(['png'], 'logo.png', {type: 'image/png'});
    const first = createCompanyLogo(file);
    const next = createCompanyLogo(file);
    expect(first.id).not.toBe(next.id);
    expect(first.file).toBe(file);
    const invalid = createCompanyLogo(new File(['not-image'], 'logo.png', {type: 'text/plain'}));
    expect(validateCompanyLogo({...invalid, type: 'image/png'})).toBe('Logo 仅支持 PNG 或 JPEG 图片');
  });

  test('RHF 处理更换、错误、删除与重置，恢复已有 Logo 并清理交互状态', async () => {
    const form = createFormControl<ProfileValues>({defaultValues: enterpriseProfile()});
    form.register('company.logo', {validate: validateCompanyLogo});
    const unsubscribe = form.subscribe({
      formState: {errors: true, dirtyFields: true, touchedFields: true},
      callback: () => {},
    });
    try {
      const upload = createCompanyLogo(new File(['png'], 'new-logo.png', {type: 'image/png'}));
      form.setValue('company.logo', upload, {shouldDirty: true, shouldTouch: true});
      expect(await form.trigger('company.logo')).toBe(true);
      expect(form.getFieldState('company.logo')).toMatchObject({isDirty: true, isTouched: true});
      expect(form.getValues('company.logo')?.file).toBe(upload.file);
      form.setValue('company.logo', createCompanyLogo(new File(['gif'], 'logo.gif', {type: 'image/gif'})));
      expect(await form.trigger('company.logo')).toBe(false);
      expect(form.getErrors('company.logo')?.message).toBe('Logo 仅支持 PNG 或 JPEG 图片');
      form.setValue('company.logo', null, {shouldDirty: true});
      expect(await form.trigger('company.logo')).toBe(true);
      expect(form.getErrors('company.logo')).toBeUndefined();
      form.reset();
      expect(form.getValues('company.logo')).toEqual(existingLogo);
      expect(form.getFieldState('company.logo')).toMatchObject({isDirty: false, isTouched: false});
      form.unregister('company.logo');
      expect(form.getValues('company.logo')).toBeUndefined();
    } finally {
      unsubscribe();
    }
  });

  test('保存后仍可恢复本地文件，观察、快照和草稿不携带文件内容', async () => {
    vi.useFakeTimers();
    const values = enterpriseProfile();
    const logo = createCompanyLogo(new File(['png'], 'new-logo.png', {type: 'image/png'}));
    values.company!.logo = logo;
    const request = saveProfile(values, 'success');
    await vi.runAllTimersAsync();
    const result = await request;
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.company?.logo?.file).toBe(logo.file);
    const preview = previewProfile(result.profile);
    expect(preview.company?.logo).toMatchObject({name: 'new-logo.png', size: 3, type: 'image/png'});
    expect(preview.company?.logo).not.toHaveProperty('file');
    preview.company!.logo!.name = 'preview-only.png';
    expect(result.profile.company?.logo?.name).toBe('new-logo.png');
  });
});
