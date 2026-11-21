import type {ReactNode} from 'react';
import {useFormState, type UseFormReturn} from 'react-hook-form';
import {Field, FieldError} from '@badnpm/ui';
import type {FormSchema} from './schema';

type Props = {
  form: UseFormReturn<FormSchema>;
  name: `values.${string}`;
  id: string;
  children: (feedback: {invalid: boolean; describedBy: string | undefined}) => ReactNode;
};

/** 只订阅一个字段的错误，不 watch 值，也不订阅整个 formState。
 * 非受控输入每次按键只更新 DOM/RHF；错误发生变化时才需要更新这层 UI。
 * render 函数让输入同时获得 aria-invalid、错误关联 ID，避免只显示红字而遗漏无障碍信息。 */
export default function FieldFeedback({form, name, id, children}: Props) {
  const state = useFormState({control: form.control, name, exact: true});
  const {error} = form.getFieldState(name, state);
  return (
    <Field data-invalid={Boolean(error)} className="min-w-0 gap-2 py-1">
      {children({invalid: Boolean(error), describedBy: error ? `${id}-error` : undefined})}
      {error && <FieldError id={`${id}-error`}>{error.message}</FieldError>}
    </Field>
  );
}
