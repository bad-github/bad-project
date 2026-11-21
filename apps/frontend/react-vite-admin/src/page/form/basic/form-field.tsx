import type {AriaAttributes, ReactNode} from 'react';
import {useFormContext, useFormState} from 'react-hook-form';
import {Field, FieldContent, FieldDescription, FieldError, FieldLabel, FieldTitle} from '@badnpm/ui';
import type {RegistrationValues} from './form-model';

type FieldAttributes = Pick<AriaAttributes, 'aria-invalid' | 'aria-describedby' | 'aria-labelledby'> & {id: string};

type Props = {
  name: keyof RegistrationValues;
  label: string;
  required?: boolean;
  group?: boolean;
  description?: string;
  className?: string;
  children: (attributes: FieldAttributes) => ReactNode;
};

/**
 * 统一标签、说明和错误的展示，不参与字段注册或创建另一个表单。
 * register 与 Controller 字段都复用此包装层，校验规则仍由各自的字段定义。
 * 组合控件使用 FieldTitle 标记组名，单一控件通过 FieldLabel 关联实际可聚焦元素。
 */
export default function FormField({name, label, required, group, description, className, children}: Props) {
  const {control, getFieldState} = useFormContext<RegistrationValues>();
  // exact:true 只订阅这个字段路径，其他字段的错误不会直接使此包装层更新。
  // getFieldState 本身是读取 API；传入订阅得到的 state 才能持续得到最新错误。
  const state = useFormState({control, name, exact: true});
  const {error} = getFieldState(name, state);
  const id = `basic-${name}`;
  // aria-describedby 可同时引用说明和错误；错误出现/消失时同步更新，供读屏器读取。
  const describedBy =
    [description && `${id}-description`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  const title = (
    <>
      {label}
      {required && (
        <span aria-hidden="true" className="font-semibold text-red-500 dark:text-red-400">
          *
        </span>
      )}
    </>
  );

  return (
    <Field data-invalid={Boolean(error)} className={className}>
      <FieldContent className="flex-none">
        {group ? (
          <FieldTitle id={`${id}-label`}>{title}</FieldTitle>
        ) : (
          <FieldLabel id={`${id}-label`} htmlFor={id}>
            {title}
          </FieldLabel>
        )}
      </FieldContent>
      {/* 属性必须落到真正的输入、触发按钮或控件组上，不能只挂到外层装饰容器。 */}
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': describedBy,
        'aria-labelledby': `${id}-label`,
      })}
      {description && <FieldDescription id={`${id}-description`}>{description}</FieldDescription>}
      <FieldError id={`${id}-error`} errors={[error]} />
    </Field>
  );
}
