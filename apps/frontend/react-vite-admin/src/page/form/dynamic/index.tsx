import {useEffect, useState} from 'react';
import {FormProvider, useFieldArray, useForm} from 'react-hook-form';
import {Button} from '@badnpm/ui';
import ContactRow from './contact-row';
import FormObserver from './form-observer';
import {
  MAX_CONTACTS,
  contactResolver,
  createContact,
  createDefaultValues,
  getContactExample,
  type ContactValues,
} from './form-model';

export default function DynamicForm() {
  // 默认联系人只在初始化时创建，避免页面每次重渲染都无意义地分配新业务 ID。
  const [defaultValues] = useState(createDefaultValues);
  const form = useForm<ContactValues>({
    // 默认值同时决定初始内容与 dirty 的比较基准；只有 reset 才会更新这一基准。
    defaultValues,
    resolver: contactResolver,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    // 重排和 update 涉及重新挂载。保留默认 false，避免卸载时意外注销仍需保留的值。
    // 删除一行用 remove，它同时处理值、错误、touched 等对应的数组状态。
    shouldUnregister: false,
  });
  // 同名数组只创建一个 useFieldArray；把方法传给右侧，不在那里再创建一份实例。
  const array = useFieldArray({control: form.control, name: 'contacts'});
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState<ContactValues | null>(null);
  const {isSubmitting} = form.formState;
  useEffect(() => {
    // 数组操作会搬移旧错误，但跨行唯一性还需重新计算。
    // 只在已有错误或提交过时主动校验，避免初次打开就显示整表必填错误。
    if (form.getErrors('contacts') || form.formState.isSubmitted) {
      void form.trigger('contacts');
    }
  }, [array.fields, form]);
  const submit = form.handleSubmit(
    (values) => {
      // resolver 会去掉首尾空格；保存独立副本，不持有之后可能变化的表单引用。
      setSubmitted(structuredClone(values));
      setMessage(`已保存 ${values.contacts.length} 位联系人，右侧可查看本次提交。`);
    },
    () => setMessage('校验未通过，请检查联系人信息和邮箱是否重复。')
  );

  return (
    <div className="@container/dynamic-form flex h-full min-h-0 w-full flex-col overflow-hidden! p-4 md:p-6">
      <FormProvider {...form}>
        <div className="grid min-h-0 flex-1 grid-rows-[repeat(2,minmax(0,1fr))] @4xl/dynamic-form:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] @4xl/dynamic-form:grid-rows-[minmax(0,1fr)]">
          <form
            noValidate
            onSubmit={submit}
            className="min-h-0 min-w-0 overflow-y-auto overscroll-contain px-1 pb-4 @4xl/dynamic-form:pr-6"
          >
            <header className="mb-6">
              <h1 className="text-lg font-semibold">联系人管理</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                维护 1–5 位联系人的姓名和邮箱，支持增删和调整顺序。右侧观察数组结构与表单状态，数据仅在当前页面处理。
              </p>
            </header>
            {/* field.id 是 RHF 渲染标识，不是业务主键，不会自动进入提交数据。
                禁止用 index 当 key，避免删除/排序后输入框本地状态错配到另一行。 */}
            {array.fields.map((field, index) => (
              <ContactRow
                key={field.id}
                fieldId={field.id}
                contactId={field.contactId}
                index={index}
                total={array.fields.length}
                disabled={isSubmitting}
                onMove={(from, to) => {
                  array.move(from, to);
                  setMessage('已调整联系人顺序，输入值与对应状态随行移动。');
                }}
                onRemove={(row) => {
                  array.remove(row);
                  setMessage('已删除联系人；至少需要一位联系人才能保存。');
                }}
                onFill={(row) => {
                  const {contactId} = form.getValues(`contacts.${row}`);
                  const example = getContactExample(contactId);
                  // 填充已有行用叶子字段 setValue，不用 update，保留业务 ID、field.id 与输入框实例。
                  // 先写完两个值，再统一校验数组，避免中间值触发校验和跨行邮箱错误残留。
                  form.setValue(`contacts.${row}.name`, example.name, {shouldDirty: true, shouldTouch: true});
                  form.setValue(`contacts.${row}.email`, example.email, {shouldDirty: true, shouldTouch: true});
                  void form.trigger('contacts');
                  setMessage(`已填充联系人${contactId}的姓名和邮箱，联系人 ID 保持不变。`);
                }}
              />
            ))}
            {array.fields.length === 0 && (
              <p className="text-muted-foreground py-8 text-sm">暂无联系人，点击下方“新增”添加联系人。</p>
            )}
            <Button
              type="button"
              variant="default"
              className="mt-4"
              disabled={isSubmitting || array.fields.length >= MAX_CONTACTS}
              onClick={() => {
                // 列表入口只创建空白行，并显式关闭 append 默认的自动聚焦。
                array.append(createContact(), {shouldFocus: false});
                setMessage('已新增空白联系人，不自动聚焦或填充内容。');
              }}
            >
              新增
            </Button>
            <p role="status" aria-live="polite" className="text-muted-foreground mt-5 text-sm">
              {message}
            </p>
            <div className="mt-4 flex justify-end border-t pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '保存中…' : '保存联系人'}
              </Button>
            </div>
          </form>
          <FormObserver
            form={form}
            array={array}
            submitted={submitted}
            onMessage={setMessage}
            onReset={() => setSubmitted(null)}
          />
        </div>
      </FormProvider>
    </div>
  );
}
