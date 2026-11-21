import {describe, expect, test} from 'vitest';
import {createFormControl} from 'react-hook-form';
import {
  createDefaultValues,
  createExampleValues,
  parseAge,
  previewValues,
  rules,
  type RegistrationValues,
} from './form-model';

function createRegisteredForm() {
  const form = createFormControl<RegistrationValues>({defaultValues: createDefaultValues()});
  const unsubscribe = form.subscribe({
    formState: {errors: true, dirtyFields: true, touchedFields: true},
    callback: () => {},
  });
  form.register('name', rules.name);
  form.register('age', rules.age);
  form.register('email', rules.email);
  form.register('password', rules.password);
  form.register('region', rules.region);
  form.register('introduction', rules.introduction);
  form.register('course', rules.course);
  form.register('organization', rules.organization);
  form.register('attendance', rules.attendance);
  form.register('date', rules.date);
  form.register('period', rules.period);
  form.register('hours', rules.hours);
  form.register('topics', rules.topics);
  form.register('waitlist');
  form.register('notify');
  form.register('verificationCode', rules.verificationCode);
  form.register('agreement', rules.agreement);
  return {form, unsubscribe};
}

describe('基础报名表', () => {
  test('空表阻止提交；示例回填后通过真实 RHF 校验并提交完整数据', async () => {
    const {form, unsubscribe} = createRegisteredForm();
    try {
      let submitted: RegistrationValues | undefined;
      await form.handleSubmit((values) => {
        submitted = values;
      })();
      expect(submitted).toBeUndefined();
      expect(Object.keys(form.getErrors())).toHaveLength(11);

      const example = createExampleValues();
      form.setValues(example, {shouldDirty: true, shouldTouch: true});
      expect(await form.trigger()).toBe(true);
      expect(form.getErrors()).toEqual({});
      const result = await form.handleSubmit((values) => {
        submitted = values;
        return values.name;
      })();
      expect(submitted).toEqual(example);
      expect(result).toBe(example.name);
      expect(form.getFieldState('name')).toMatchObject({isDirty: true, isTouched: true});

      form.resetField('name');
      expect(form.getValues('name')).toBe('');
      form.reset();
      expect(form.getValues()).toEqual(createDefaultValues());
      expect(form.getErrors()).toEqual({});
      expect(form.getFieldState('name')).toMatchObject({isDirty: false, isTouched: false});
    } finally {
      unsubscribe();
    }
  });

  test('年龄边界、非法日期、验证码和未同意条款会绑定各自字段错误', async () => {
    const {form, unsubscribe} = createRegisteredForm();
    try {
      form.setValues({
        ...createExampleValues(),
        age: 15,
        date: '2026-02-30',
        verificationCode: '654321',
        agreement: false,
      });
      expect(await form.trigger()).toBe(false);
      expect(Object.keys(form.getErrors()).sort()).toEqual(['age', 'agreement', 'date', 'verificationCode']);
      expect(form.getErrors('date')?.message).toBe('请选择有效的参加日期');

      form.setValues({...createExampleValues(), age: 16, topics: [], notify: false, waitlist: false});
      expect(await form.trigger()).toBe(true);
      form.setValue('age', 80);
      expect(await form.trigger('age')).toBe(true);
      form.setValue('age', 24.5);
      expect(await form.trigger('age')).toBe(false);
      form.setValue('topics', ['React', 'React']);
      expect(await form.trigger('topics')).toBe(false);
    } finally {
      unsubscribe();
    }
  });

  test('数字空值不变成 0；观察快照脱敏并与后续编辑隔离', () => {
    expect(parseAge('')).toBeNull();
    expect(parseAge('invalid')).toBeNull();
    expect(parseAge('0')).toBe(0);
    const values = createExampleValues();
    const snapshot = previewValues(values);
    const originalPeriod = [...values.period];
    values.period[0] = '2020-01-01';
    values.topics.push('工程化');
    values.name = '后续修改';
    expect(snapshot.name).toBe('林同学');
    expect(snapshot.topics).toEqual(['React', 'TypeScript']);
    expect(snapshot.period).toEqual(originalPeriod);
    expect(snapshot.password).not.toBe(values.password);
    expect(snapshot.verificationCode).not.toBe(values.verificationCode);
    expect(previewValues(createDefaultValues()).password).toBe('');
  });

  test('学习周期拒绝半选、非法日期、同日和倒序，支持跨月跨年', async () => {
    const {form, unsubscribe} = createRegisteredForm();
    try {
      for (const period of [
        [],
        ['2026-10-19'],
        ['2026-02-30', '2026-03-05'],
        ['2026-10-19', '2026-10-19'],
        ['2026-10-20', '2026-10-19'],
      ]) {
        form.setValue('period', period);
        expect(await form.trigger('period')).toBe(false);
        expect(form.getErrors('period')?.message).toBeTruthy();
      }
      form.setValue('period', ['2026-12-25', '2027-01-10']);
      expect(await form.trigger('period')).toBe(true);
      form.resetField('period');
      expect(form.getValues('period')).toEqual([]);
    } finally {
      unsubscribe();
    }
  });
});
