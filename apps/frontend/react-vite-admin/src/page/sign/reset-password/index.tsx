import {toast, Field, FieldLabel, FieldError, BadButton, BadInput} from '@badnpm/ui';
import {supabaseApi} from '@/supabase';
import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router';
import {useTranslation} from 'react-i18next';
import {Controller, useForm, useWatch} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {formSchema, type FormSchema} from './schema';
import RequiredTag from '@/components/required-tag';
import {PasswordStrength} from '../password-strength';
import SignWrapper from '../sign-wrapper';

export default function ResetPassword() {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    mode: 'all',
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });
  const watchPassword = useWatch({control: form.control, name: 'password'});
  useEffect(() => {
    const confirmValue = form.getValues('confirmPassword');
    if (confirmValue) {
      form.trigger('confirmPassword');
    }
  }, [watchPassword, form]);

  const changePassword = async (password: string) => {
    setLoading(true);
    const {error} = await supabaseApi.auth.updateUser({password});
    setLoading(false);
    if (error) {
      console.error(error);
      toast.add({title: error.message, type: 'error'});
    } else {
      // 由于点击邮件链接设置了token，这里需要手动退出，然后用新密码重新登录
      await supabaseApi.auth.signOut();
      toast.add({title: '操作成功', type: 'success'});
      navigate('/');
    }
  };

  const onSubmit = (values: FormSchema) => {
    console.log('submit', values);
    changePassword(values.password);
  };
  const onError = (errors: any) => {
    console.error('error', errors);
  };

  return (
    <SignWrapper>
      <div className="w-xs">
        <div className="flex flex-col items-center pb-8 text-center">
          <h1 className="text-2xl font-bold">{t('sign.newPasswordTitle')}</h1>
        </div>
        <form className="space-y-6" noValidate onSubmit={form.handleSubmit(onSubmit, onError)}>
          <Controller
            control={form.control}
            name="password"
            render={({field, fieldState}) => {
              return (
                <Field data-invalid={fieldState.invalid} className="grid gap-2">
                  <FieldLabel htmlFor="password">
                    <RequiredTag />
                    {t('sign.newPassword')}
                  </FieldLabel>
                  <BadInput
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? 'password-error' : undefined}
                    aria-required="true"
                    type="password"
                    id="password"
                    placeholder="******"
                    autoComplete="current-password"
                    {...field}
                  />
                  <PasswordStrength value={field.value} />
                  <FieldError id="password-error" errors={[fieldState.error]} />
                </Field>
              );
            }}
          />
          <Controller
            control={form.control}
            name="confirmPassword"
            render={({field, fieldState}) => (
              <Field data-invalid={fieldState.invalid} className="grid gap-2">
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="confirmPassword">
                    <RequiredTag />
                    {t('sign.confirmPassword')}
                  </FieldLabel>
                </div>
                <BadInput
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? 'confirmPassword-error' : undefined}
                  aria-required="true"
                  type="password"
                  id="confirmPassword"
                  placeholder="******"
                  autoComplete="current-password"
                  {...field}
                />
                <FieldError id="confirmPassword-error" errors={[fieldState.error]} />
              </Field>
            )}
          />
          <BadButton loading={loading} type="submit" className="w-full">
            {t('sign.changePassword')}
          </BadButton>
        </form>
      </div>
    </SignWrapper>
  );
}
