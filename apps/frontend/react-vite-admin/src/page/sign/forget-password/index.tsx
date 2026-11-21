import {Button, toast, Input, Field, FieldLabel, FieldError, BadButton} from '@badnpm/ui';
import {supabaseApi} from '@/supabase';
import {useState} from 'react';
import {useNavigate} from 'react-router';
import {useTranslation} from 'react-i18next';
import {zodResolver} from '@hookform/resolvers/zod';
import {Controller, useForm} from 'react-hook-form';
import {formSchema, type FormSchema} from './schema';
import SignWrapper from '../sign-wrapper';

export default function ForgetPassword() {
  const navigate = useNavigate();
  const {t} = useTranslation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  /**
   * 密码重置包含两步
   * (1)重置密码链接发送到用户邮箱：点击该链接后会重定向到redirectTo，并且会往localStorage中写入token(但此时居然可以直接进入系统了，虽然这个token有效期1小时)
   * (2)更新用户密码
   */
  const resetPassword = async (email: string) => {
    setLoading(true);
    const {error} = await supabaseApi.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:5173/g/reset-password',
    });
    setLoading(false);
    if (error) {
      console.error(error);
      toast.add({title: error.message, type: 'error'});
    } else {
      setSuccess(true);
      form.reset();
    }
  };

  const onSubmit = (values: FormSchema) => {
    console.log('submit', values);
    resetPassword(values.email);
  };
  const onError = (errors: any) => {
    console.error('error', errors);
  };

  return (
    <SignWrapper>
      <div className="w-xs">
        <div className="flex flex-col items-center pb-8 text-center">
          <h1 className="text-2xl font-bold">{t('sign.forgetPassword')}</h1>
          {success && (
            <p className="text-muted-foreground text-sm">
              {t('sign.checkEmail')}&nbsp;
              <Button className="p-0" variant="link" onClick={() => navigate('/sign-in')}>
                {t('sign.backSignIn')}
              </Button>
            </p>
          )}
        </div>
        <form className="space-y-6" noValidate onSubmit={form.handleSubmit(onSubmit, onError)}>
          <Controller
            control={form.control}
            name="email"
            render={({field, fieldState}) => (
              <Field data-invalid={fieldState.invalid} className="grid gap-2">
                <FieldLabel htmlFor="email" className="sr-only">
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
          <BadButton loading={loading} type="submit" className="w-full">
            {t('sign.sendResetLink')}
          </BadButton>
          <Button variant="outline" type="button" className="w-full" onClick={() => navigate(-1)}>
            {t('sign.back')}
          </Button>
        </form>
      </div>
    </SignWrapper>
  );
}
