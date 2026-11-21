import {i18n} from '@/i18n';
import {z} from 'zod';

export const formSchema = z.object({
  email: z
    .string({
      required_error: i18n.t('form.placeholderE'),
    })
    .min(1, {message: i18n.t('form.placeholderE')}) // 必填
    .email({message: i18n.t('form.emailInvalid')}), // 格式校验
});

export type FormSchema = z.infer<typeof formSchema>;
