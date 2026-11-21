import {useState} from 'react';
import {FormProvider, useForm} from 'react-hook-form';
import {Button, FieldGroup, FieldSeparator} from '@badnpm/ui';
import ProfileFields from './profile-fields';
import EnrollmentFields from './enrollment-fields';
import PreferenceFields from './preference-fields';
import FormObserver, {type FormSnapshot} from './form-observer';
import {createDefaultValues, createExampleValues, previewValues, type RegistrationValues} from './form-model';

/**
 * 基础页只创建一个 RHF 实例：左侧负责输入，右侧通过同一个 control 观察数据。
 * 普通输入使用 register，受控组件使用 Controller；两种接法共享默认值、校验和提交。
 */
export default function BasicForm() {
  const form = useForm<RegistrationValues>({
    // defaultValues 同时是初值和 dirty 比较基准，RHF 会缓存它。
    // 重新渲染或传入一个新对象不会重新回填；更新初值应显式调用 reset。
    defaultValues: createDefaultValues(),
    // 首次提交前以失焦触发校验，避免用户每输入一个字符就看到错误。
    mode: 'onBlur',
    // 提交后再编辑字段时按 change 重新校验，方便及时消除错误。
    // 它不是初始校验模式，不能替代上面的 mode。
    reValidateMode: 'onChange',
  });
  // 读取 formState 属性会建立订阅；这里只让页面根组件关心提交中的禁用状态。
  // 表单值和其他状态由右侧订阅，避免每次输入都让整张表单重新渲染。
  const {isSubmitting} = form.formState;
  const [snapshot, setSnapshot] = useState<FormSnapshot | null>(null);
  const [submitted, setSubmitted] = useState<RegistrationValues | null>(null);
  const [message, setMessage] = useState('');

  // handleSubmit 先执行所有已注册字段的校验，再选择成功/失败回调。
  // 它会管理 errors、isSubmitting、isSubmitted、submitCount 等状态，并默认聚焦错误字段。
  // 成功回调返回的 Promise 必须被等待，否则 isSubmitting 会提前结束。
  const submit = form.handleSubmit(
    async (values) => {
      setMessage('正在提交…');
      // 仅模拟异步请求，既不调用远端接口，也不持久化报名资料。
      // 展示副本而非原始密码；不要把脱敏后的字符串重新 setValue 回业务字段。
      const result = previewValues(values);
      await new Promise<void>((resolve) => setTimeout(resolve, 600));
      setSubmitted(result);
      setMessage('提交成功，右侧已展示本次报名数据。');
    },
    (errors) => setMessage(`还有 ${Object.keys(errors).length} 个字段需要完善，请查看对应提示。`)
  );

  const readSnapshot = () => {
    // getValues/getErrors/getFieldState 都是按需读取，不负责建立实时订阅。
    // getFieldState 的各状态需要相应订阅；本页右侧已通过 useFormState 订阅。
    const {invalid, isDirty, isTouched, isValidating} = form.getFieldState('name');
    setSnapshot({
      values: previewValues(form.getValues()),
      // FieldError 可能包含 DOM ref，直接 JSON.stringify 整个错误对象可能出现循环引用。
      errors: Object.fromEntries(
        Object.entries(form.getErrors()).flatMap(([name, error]) => (error?.message ? [[name, error.message]] : []))
      ),
      name: {invalid, isDirty, isTouched, isValidating},
    });
    setMessage('已读取当前快照，后续输入不会改变这份快照。');
  };

  const fillExample = () => {
    // setValues 批量更新当前值，不更新 defaultValues；shouldDirty 比较默认值，shouldValidate 执行校验。
    // 未设置 shouldTouch，因此不会把回填字段全部标记为用户已访问。
    form.setValues(createExampleValues(), {shouldDirty: true, shouldValidate: true});
    setMessage('已填入可直接提交的示例数据。');
  };

  const validateForm = async () => {
    // undefined 表示整表校验；shouldFocus 聚焦首个错误，shouldTouch 更新触碰状态。
    // trigger 不执行提交回调，也不增加 submitCount。
    const valid = await form.trigger(undefined, {shouldFocus: true, shouldTouch: true});
    setMessage(valid ? '所有字段校验通过，可以提交。' : '校验未通过，请查看字段下方的提示。');
  };

  const resetForm = () => {
    // reset 恢复默认值，清理错误、dirty、touched 和提交状态。
    // 快照和最近提交由 React 管理，需要另行清理。
    form.reset();
    setSnapshot(null);
    setSubmitted(null);
    setMessage('已恢复默认值，并清理错误和交互状态。');
  };

  return (
    <div className="@container/basic-form flex h-full min-h-0 w-full flex-col gap-5 overflow-hidden! p-4 md:p-6">
      {/* Provider 只共享 RHF 方法，不生成 HTML form；子组件用 useFormContext 取同一个实例。 */}
      <FormProvider {...form}>
        <div className="grid min-h-0 flex-1 grid-rows-[repeat(2,minmax(0,1fr))] @4xl/basic-form:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] @4xl/basic-form:grid-rows-[minmax(0,1fr)]">
          <form
            // 关闭浏览器内置校验提示，错误统一交给 RHF；不会关闭 RHF 的 rules。
            noValidate
            onSubmit={submit}
            className="min-h-0 min-w-0 overflow-y-auto overscroll-contain px-1 pb-4 @4xl/basic-form:pr-6"
          >
            <header className="mb-6">
              <h1 className="text-lg font-semibold">技术训练营报名</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                填写报名资料、安排学习周期并提交报名，右侧实时观察表单数据与状态。数据仅在当前页面处理。
              </p>
            </header>
            <FieldGroup className="gap-6">
              <ProfileFields />
              <FieldSeparator />
              <EnrollmentFields />
              <FieldSeparator />
              <PreferenceFields />
            </FieldGroup>
            <p role="status" aria-live="polite" className="text-muted-foreground mt-5 text-sm">
              {message}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
              <Button type="submit" disabled={isSubmitting} className="ml-auto">
                {isSubmitting ? '提交中…' : '提交报名'}
              </Button>
            </div>
          </form>
          <FormObserver
            form={form}
            snapshot={snapshot}
            submitted={submitted}
            onFillExample={fillExample}
            onReadSnapshot={readSnapshot}
            onValidate={validateForm}
            onReset={resetForm}
          />
        </div>
      </FormProvider>
    </div>
  );
}
