import {toast, Field, FieldLabel, FieldError, BadButton, BadInput} from '@badnpm/ui';
import {supabaseApi} from '@/supabase';
import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router';
import {useTranslation} from 'react-i18next';
import {zodResolver} from '@hookform/resolvers/zod';
import {useShallow} from 'zustand/shallow';
import {Controller, useForm, useWatch} from 'react-hook-form';
import useUserStore from '@/store/user';
import RequiredTag from '@/components/required-tag';
import {PasswordStrength} from '../password-strength';
import {formSchema, type FormSchema} from './schema';
import SignWrapper from '../sign-wrapper';

export default function UpdatePassword() {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const {user} = useUserStore(useShallow((state) => ({user: state.user})));
  const form = useForm<FormSchema>({
    mode: 'all',
    resolver: zodResolver(formSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
  const watchNewPassword = useWatch({control: form.control, name: 'newPassword'});
  useEffect(() => {
    const confirmValue = form.getValues('confirmPassword');
    if (confirmValue) {
      form.trigger('confirmPassword');
    }
  }, [watchNewPassword, form]);

  const updatePassword = async (values: FormSchema) => {
    if (!user.email) {
      toast.add({title: 'email not found', type: 'error'});
      return;
    }
    setLoading(true);

    const {error: error1} = await supabaseApi.auth.signInWithPassword({
      email: user.email,
      password: values.oldPassword,
    });
    // 旧密码错误
    if (error1) {
      toast.add({title: 'old password is incorrect', type: 'error'});
      setLoading(false);
      return;
    }
    const {error: error2} = await supabaseApi.auth.updateUser({password: values.newPassword});
    setLoading(false);
    if (error2) {
      toast.add({title: error2.message, type: 'error'});
    } else {
      toast.add({title: t('common.actionSuccess'), type: 'success'});
      navigate('/sign-in');
    }
  };

  const onSubmit = (values: FormSchema) => {
    console.log('submit', values);
    updatePassword(values);
  };
  const onError = (errors: any) => {
    console.error('error', errors);
  };

  return (
    <SignWrapper>
      <div className="w-xs">
        <div className="flex flex-col items-center pb-8 text-center">
          <h1 className="text-2xl font-bold">{t('sign.updatePassword')}</h1>
        </div>
        <form className="space-y-6" noValidate onSubmit={form.handleSubmit(onSubmit, onError)}>
          <Controller
            control={form.control}
            name="oldPassword"
            render={({field, fieldState}) => {
              return (
                <Field data-invalid={fieldState.invalid} className="grid gap-2">
                  <FieldLabel htmlFor="oldPassword">
                    <RequiredTag />
                    {t('sign.oldPassword')}
                  </FieldLabel>
                  <BadInput
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? 'oldPassword-error' : undefined}
                    aria-required="true"
                    type="password"
                    id="oldPassword"
                    placeholder="******"
                    autoComplete="current-password"
                    {...field}
                  />
                  <FieldError id="oldPassword-error" errors={[fieldState.error]} />
                </Field>
              );
            }}
          />
          <Controller
            control={form.control}
            name="newPassword"
            render={({field, fieldState}) => {
              return (
                <Field data-invalid={fieldState.invalid} className="grid gap-2">
                  <FieldLabel htmlFor="newPassword">
                    <RequiredTag />
                    {t('sign.newPassword')}
                  </FieldLabel>
                  <BadInput
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.error ? 'newPassword-error' : undefined}
                    aria-required="true"
                    type="password"
                    id="newPassword"
                    placeholder="******"
                    autoComplete="current-password"
                    {...field}
                  />
                  <PasswordStrength value={field.value} />
                  <FieldError id="newPassword-error" errors={[fieldState.error]} />
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
            {t('sign.updatePassword')}
          </BadButton>
        </form>
      </div>
    </SignWrapper>
  );
}
