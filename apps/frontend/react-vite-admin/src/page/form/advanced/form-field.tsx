import type {AriaAttributes, ReactNode} from 'react';
import {useFormContext, useFormState, type FieldPath} from 'react-hook-form';
import {Field, FieldDescription, FieldError, FieldLabel} from '@badnpm/ui';
import type {ProfileValues} from './form-model';

type Attributes = Pick<AriaAttributes, 'aria-invalid' | 'aria-describedby'> & {id: string};

/**
 * 字段展示层：只读取状态与生成可访问属性，不创建 form，也不改字段值。
 * children 是渲染函数，会在组件 render 时执行；不要在其中直接调用 setState/setValue。
 * 使用者应返回控件 JSX，把写值等副作用放进控件事件或 effect。
 */
export default function FormField({
  name,
  label,
  description,
  required,
  children,
}: {
  name: FieldPath<ProfileValues>;
  label: string;
  description?: string;
  required?: boolean;
  children: (attributes: Attributes) => ReactNode;
}) {
  const {control, getFieldState} = useFormContext<ProfileValues>();
  // exact 匹配 company.logo 等完整路径，避免订阅整个 company 分支的所有状态。
  // getFieldState 是读取，useFormState 才提供持续更新；两者配合隔离字段级重渲染。
  const state = useFormState({control, name, exact: true});
  const {error, isValidating} = getFieldState(name, state);
  const id = `advanced-${name.replaceAll('.', '-')}`;
  // 说明、错误、校验中提示都通过 ID 关联到输入/按钮，让读屏器可获得当前状态。
  const describedBy =
    [description && `${id}-description`, error && `${id}-error`, isValidating && `${id}-validating`]
      .filter(Boolean)
      .join(' ') || undefined;
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden="true" className="font-semibold text-red-500 dark:text-red-400">
            *
          </span>
        )}
      </FieldLabel>
      {children({id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy})}
      {description && <FieldDescription id={`${id}-description`}>{description}</FieldDescription>}
      {/* 这里展示 RHF 的校验状态；文件上传是独立请求状态，由 Logo 控件另外展示。 */}
      {isValidating && (
        <p id={`${id}-validating`} role="status" className="text-primary text-xs">
          正在校验…
        </p>
      )}
      <FieldError id={`${id}-error`} errors={[error]} />
    </Field>
  );
}
