import {Button, toast, Input, Checkbox, Field, FieldLabel, FieldError, BadButton, BadInput} from '@badnpm/ui';
import {supabaseApi} from '@/supabase';
import {useState} from 'react';
import {useNavigate} from 'react-router';
import {useTranslation} from 'react-i18next';
import {Controller, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import IconGithub from '@/assets/svg/github.svg?react';
import IconGoogle from '@/assets/svg/google.svg?react';
import IconApple from '@/assets/svg/apple.svg?react';
import RequiredTag from '@/components/required-tag';
import {formSchema, type FormSchema} from './schema';
import SignWrapper from '../sign-wrapper';
import useSignStore from './sign-store';
import {useShallow} from 'zustand/shallow';

export default function SignIn() {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const {setFocused, showPassword, setShowPassword} = useSignStore(
    useShallow((s) => ({
      setFocused: s.setFocused,
      showPassword: s.showPassword,
      setShowPassword: s.setShowPassword,
    }))
  );
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: 'newjeans@gmail.com',
      password: '123456',
      isRemember: false,
    },
  });
  const signInWithEmail = async (email: string, password: string) => {
    // 会往localStorage中写入token
    setLoading(true);
    const {data, error} = await supabaseApi.auth.signInWithPassword({email, password});
    setLoading(false);
    if (error) {
      console.error(error);
      toast.add({title: error.message, type: 'error'});
    } else {
      console.log(data);
      toast.add({title: t('sign.signInSuccess'), type: 'success'});
    }
    // todo，不管成功与否全部跳转
    navigate('/');
  };

  const onSubmit = (values: FormSchema) => {
    console.log('submit', values);
    signInWithEmail(values.email, values.password);
  };
  const onError = (errors: any) => {
    console.error('error', errors);
  };
  return (
    <SignWrapper>
      <div className="w-xs">
        <div className="flex flex-col items-center pb-8 text-center">
          <h1 className="text-2xl font-bold">{t('sign.signInTitle')}</h1>
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
                  onFocus={() => setFocused(true)}
                  onBlur={() => {
                    setFocused(false);
                    field.onBlur(); // 必须手动触发一下它，否则表单会失去“触碰/校验”追踪
                  }}
                />
                <FieldError id="email-error" errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="password"
            render={({field, fieldState}) => (
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
                  showPassword={showPassword}
                  onFocus={() => setFocused(true)}
                  onBlur={() => {
                    setFocused(false);
                    field.onBlur();
                  }}
                  onShowPasswordChange={(visible) => setShowPassword(visible)}
                />
                <FieldError id="password-error" errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="isRemember"
            render={({field, fieldState}) => (
              <div className="-mt-3 flex items-center justify-between">
                <Field data-invalid={fieldState.invalid} orientation="horizontal" className="w-auto gap-2">
                  <Checkbox
                    id="isRemember"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    aria-invalid={fieldState.invalid}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FieldLabel htmlFor="isRemember">{t('sign.remember')}</FieldLabel>
                </Field>
                {/* 在 HTML 里，<button> 默认的 type 是 submit，需要手动指定 type="button"才不会触发表单提交 */}
                <Button type="button" variant="link" className="p-0" onClick={() => navigate('/forget-password')}>
                  {t('sign.forgetPassword')}
                </Button>
              </div>
            )}
          />
          <BadButton loading={loading} type="submit" className="w-full">
            {t('sign.signIn')}
          </BadButton>
        </form>
        <div className="flex flex-col gap-4 pt-6">
          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-background text-muted-foreground relative z-10 px-2">{t('sign.signOr')}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Button variant="outline" type="button" className="w-full">
              <IconGithub />
              <span className="sr-only">Login with Github</span>
            </Button>
            <Button variant="outline" type="button" className="w-full">
              <IconGoogle />
              <span className="sr-only">Login with Google</span>
            </Button>
            <Button variant="outline" type="button" className="w-full">
              <IconApple />
              <span className="sr-only">Login with Apple</span>
            </Button>
          </div>
          <div className="text-center text-sm">
            {t('sign.noAccount')}
            <Button size="sm" variant="link" onClick={() => navigate('/sign-up')}>
              {t('sign.signUp')}
            </Button>
          </div>
        </div>
      </div>
    </SignWrapper>
  );
}
