import {z} from 'zod';
import {i18n} from '@/i18n';
import {regex} from '@workspace/utils';

export const formSchema = z
  .object({
    email: z
      .string({
        required_error: i18n.t('form.placeholderE'),
      })
      .min(1, {message: i18n.t('form.placeholderE')}) // 必填
      .email({message: i18n.t('form.emailInvalid')}), // 格式校验

    password: z
      .string({
        required_error: i18n.t('form.placeholderE'),
      })
      .min(1, {message: i18n.t('form.placeholderE')}) // 必填
      .min(8, {message: i18n.t('form.validation.minLength', {field: '', min: 8})})
      .regex(regex.ruleB, {message: i18n.t('form.validation.ruleA', {field: ''})}),
    confirmPassword: z
      .string({
        required_error: i18n.t('form.placeholderE'),
      })
      .min(1, {message: i18n.t('form.placeholderE')}),
    username: z
      .string({
        required_error: i18n.t('form.placeholderE'),
      })
      .min(1, {message: i18n.t('form.placeholderE')}), // 必填
    agree: z.boolean(),
  })
  .refine(
    (data) => {
      if (!data.confirmPassword) return true; // 不校验一致性
      // 满足条件则不校验
      return data.password === data.confirmPassword;
    },
    {
      message: i18n.t('form.differentPassword'),
      path: ['confirmPassword'], // 错误会显示在 confirmPassword 上
    }
  );

export type FormSchema = z.infer<typeof formSchema>;
