import {Button, toast, Input, Checkbox, Field, FieldLabel, FieldError, BadButton, BadInput} from '@badnpm/ui';
import {supabaseApi} from '@/supabase';
import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router';
import {useTranslation} from 'react-i18next';
import {Controller, useForm, useWatch} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import RequiredTag from '@/components/required-tag';
import {PasswordStrength} from '../password-strength';
import {formSchema, type FormSchema} from './schema';
import SignWrapper from '../sign-wrapper';

export default function SignUp() {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormSchema>({
    mode: 'all',
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
      agree: false,
    },
  });
  const watchPassword = useWatch({control: form.control, name: 'password'});
  useEffect(() => {
    const confirmValue = form.getValues('confirmPassword');
    if (confirmValue) {
      form.trigger('confirmPassword');
    }
  }, [watchPassword, form]);

  const signUpWithEmail = async (values: FormSchema) => {
    const {email, password} = values;
    setLoading(true);
    const {error} = await supabaseApi.auth.signUp({
      email,
      password,
      options: {
        /**
         * 指定邮件里的确认链接点击后要跳转的地址
         * 默认情况下，邮件里的链接会跳转到你在 Auth → URL Configuration → Site URL（若配置了Redirect URLs优先级更高 配置的地址
         * 传了 emailRedirectTo，就会覆盖默认值
         */
        emailRedirectTo: 'http://localhost:5173/g/',
        // 其他数据
        data: {username: values.username},
      },
    });
    setLoading(false);
    if (error) {
      console.error(error);
      toast.add({title: error.message, type: 'error'});
    } else {
      toast.add({title: t('sign.hasSendConfirmEmail'), type: 'success'});
      navigate('/sign-in');
    }
  };

  const onSubmit = (values: FormSchema) => {
    console.log('submit', values);
    signUpWithEmail(values);
  };
  const onError = (errors: any) => {
    console.error('error', errors);
  };
  return (
    <SignWrapper>
      <div className="w-xs">
        <div className="flex flex-col items-center pb-8 text-center">
          <h1 className="text-2xl font-bold">{t('sign.signUpTitle')}</h1>
        </div>
        <form className="space-y-6" noValidate onSubmit={form.handleSubmit(onSubmit, onError)}>
          <Controller
            control={form.control}
            name="email"
            render={({field, fieldState}) => (
              <Field data-invalid={fieldState.invalid} className="grid gap-2">
                <FieldLabel htmlFor="email">
                  <RequiredTag />
                  {t('sign.email')}
                </FieldLabel>
                <Input
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? 'email-error' : undefined}
                  aria-required="true"
                  id="email"
                  placeholder="newjeans@mail.com"
                  type="email"
                  autoComplete="email"
                  {...field}
                />
                <FieldError id="email-error" errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="password"
            render={({field, fieldState}) => {
              return (
                <Field data-invalid={fieldState.invalid} className="grid gap-2">
                  <FieldLabel htmlFor="password">
                    <RequiredTag />
                    {t('sign.password')}
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
          <Controller
            control={form.control}
            name="username"
            render={({field, fieldState}) => (
              <Field data-invalid={fieldState.invalid} className="grid gap-2">
                <FieldLabel htmlFor="username">
                  <RequiredTag />
                  {t('sign.username')}
                </FieldLabel>
                <Input
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? 'username-error' : undefined}
                  aria-required="true"
                  id="username"
                  placeholder="newjeans"
                  type="text"
                  autoComplete="username"
                  {...field}
                />
                <FieldError id="username-error" errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="agree"
            render={({field, fieldState}) => (
              <Field data-invalid={fieldState.invalid} orientation="horizontal" className="gap-1">
                <Checkbox
                  id="agree"
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  aria-invalid={fieldState.invalid}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FieldLabel htmlFor="agree" className="flex-none! gap-0.5">
                  {t('sign.agree')}
                </FieldLabel>
                <Button type="button" variant="link" className="p-0">
                  {t('sign.terms')}
                </Button>
              </Field>
            )}
          />
          <BadButton loading={loading} type="submit" className="w-full">
            {t('sign.signUp')}
          </BadButton>
        </form>
        <div className="pt-4 text-center text-sm">
          {t('sign.haveAccount')}
          <Button size="sm" variant="link" onClick={() => navigate('/sign-in')}>
            {t('sign.signIn')}
          </Button>
        </div>
      </div>
    </SignWrapper>
  );
}
