import {useFormContext, useFormState} from 'react-hook-form';
import {Button, Field, FieldError, FieldLabel, Input} from '@badnpm/ui';
import type {Contact, ContactValues} from './form-model';

type Props = {
  index: number;
  fieldId: string;
  contactId: number;
  total: number;
  disabled: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  onFill: (index: number) => void;
};
const labels: Record<Exclude<keyof Contact, 'contactId'>, string> = {name: '姓名', email: '邮箱'};

/** React key 使用稳定 field.id；注册路径使用当前 index，移动后随顺序更新。 */
export default function ContactRow({index, fieldId, contactId, total, disabled, onMove, onRemove, onFill}: Props) {
  const {register, control, getFieldState, trigger} = useFormContext<ContactValues>();
  // 订阅当前行及其子字段，不在页面根组件订阅全部错误。
  const state = useFormState({control, name: `contacts.${index}`});
  return (
    <fieldset disabled={disabled} className="@container/contact-row min-w-0 py-4 first:pt-0">
      <legend className="sr-only">联系人 {contactId}</legend>
      {/* 每位联系人是一行：姓名、邮箱和操作。按本行实际宽度布局，窄屏时操作自然换行。
          操作与输入框顶部对齐，错误增加高度时不会把按钮推到错误提示一侧。 */}
      <div className="grid grid-cols-2 items-start gap-3 @lg/contact-row:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto]">
        {(Object.keys(labels) as (keyof typeof labels)[]).map((key) => {
          const name = `contacts.${index}.${key}` as const;
          const {error} = getFieldState(name, state);
          // DOM id 使用稳定标识，重排后标签仍指向对应联系人的输入框。
          const id = `contact-${fieldId}-${key}`;
          return (
            <Field key={key} data-invalid={Boolean(error)} className="min-w-0">
              <FieldLabel htmlFor={id}>
                {/* 显示创建时的业务 ID，不能用会随排序变化的 index 充当联系人编号。 */}
                {key === 'name' ? `联系人${contactId}姓名` : labels[key]}{' '}
                <span aria-hidden="true" className="text-red-500 dark:text-red-400">
                  *
                </span>
              </FieldLabel>
              <Input
                {...register(name, {
                  // 邮箱唯一性关联多行；只校验当前路径会留下另一行的重复错误。
                  // 失焦时明确校验整个数组，让所有关联行的提示一起更新。
                  onBlur: () => {
                    void trigger('contacts');
                  },
                })}
                id={id}
                type={key === 'email' ? 'email' : 'text'}
                autoComplete={key}
                placeholder={key === 'name' ? '联系人姓名' : 'name@example.com'}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : undefined}
              />
              <FieldError id={`${id}-error`} errors={[error]} />
            </Field>
          );
        })}
        <div className="col-span-2 flex gap-1 @lg/contact-row:col-span-1 @lg/contact-row:pt-7">
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-label={`填充联系人 ${contactId}`}
            onClick={() => onFill(index)}
          >
            填充
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={index === 0}
            aria-label={`上移联系人 ${contactId}`}
            onClick={() => onMove(index, index - 1)}
          >
            上移
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={index === total - 1}
            aria-label={`下移联系人 ${contactId}`}
            onClick={() => onMove(index, index + 1)}
          >
            下移
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            aria-label={`删除联系人 ${contactId}`}
            onClick={() => onRemove(index)}
          >
            删除
          </Button>
        </div>
      </div>
    </fieldset>
  );
}
