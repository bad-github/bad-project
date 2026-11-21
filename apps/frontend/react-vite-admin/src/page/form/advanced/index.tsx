import {useMemo, useRef, useState} from 'react';
import {FormProvider, useForm} from 'react-hook-form';
import {Button} from '@badnpm/ui';
import {getProfile, saveProfile} from './api';
import {type ProfileValues, type SubmitScenario} from './form-model';
import ProfileFields from './profile-fields';
import FormObserver from './form-observer';
import {createProfileResolver} from './schema';
import {resetProfile} from './form-actions';

/**
 * 高级页围绕一个表单实例组合异步初值、条件字段、服务端错误和刷新同步。
 * 校验在 schema.ts，字段接入在 profile-fields.tsx，回填策略在 form-actions.ts。
 * 场景选择、上传中、刷新中属于界面/请求状态，不混进 ProfileValues 提交数据。
 */
export default function AdvancedForm() {
  // resolver 内持有用户名校验缓存，必须保持实例稳定；每次渲染重新创建会丢失缓存。
  const resolver = useMemo(() => createProfileResolver(), []);
  const form = useForm<ProfileValues>({
    // 配置 resolver 后由 schema 统一校验，不再同时依赖 register/Controller.rules 的校验规则。
    // Controller 中保留的 deps 仅用于字段依赖触发，不是另一套 schema。
    resolver,
    // 异步 defaultValues 由 RHF 加载并缓存，期间 isLoading=true；刷新资料需另行调用 reset。
    defaultValues: () => getProfile(),
    // 初次提交前失焦校验；提交后按 change 重新校验，修改错误可及时得到反馈。
    mode: 'onBlur',
    reValidateMode: 'onChange',
    // 企业/密码字段卸载时注销，移除它们的值和错误，避免隐藏资料仍参与提交。
    // 单纯 CSS 隐藏不算卸载。此配置影响 reset 的内部值管理，必须使用 resetProfile。
    shouldUnregister: true,
  });
  const {isLoading, isSubmitting} = form.formState;
  // formState 只描述 RHF 管理的过程；资料刷新和 Logo 上传需另外维护状态。
  const [scenario, setScenario] = useState<SubmitScenario>('success');
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState<Awaited<ReturnType<typeof saveProfile>> | null>(null);
  const refreshRevision = useRef(0);

  const refresh = async (keepDirtyValues: boolean) => {
    setRefreshing(true);
    setMessage('正在读取新的服务端资料…');
    try {
      const profile = await getProfile(++refreshRevision.current);
      // true：保留 dirtyFields 对应的当前值，更新其他值与整份默认值。
      // false：用新资料覆盖。keepDirtyValues 和 keepDirty 不同，后者只保留状态标记。
      // dirtyFields 必须被订阅，本页右侧 useFormState 已满足此要求。
      resetProfile(form, profile, {keepDirtyValues});
      setSaved(null);
      setMessage(
        keepDirtyValues
          ? '已刷新资料，保留本地修改的字段，其他字段和默认值已更新。'
          : '已使用服务端资料覆盖当前表单和默认值。'
      );
    } catch {
      // root.server 是全局错误，不附着在某个字段上，所以不要求对应 input/ref。
      form.setError('root.server', {type: 'server', message: '加载资料失败，请重试'});
    } finally {
      setRefreshing(false);
    }
  };

  // handleSubmit 等待异步 resolver 后才执行成功回调，并持续等待保存 Promise。
  // 校验失败进入第二个回调；接口失败需要自行映射 setError，不能只显示一条 React 提示。
  const submit = form.handleSubmit(
    async (values) => {
      // 清理上次全局错误，不改变规则或字段值，也不主动重新计算 isValid。
      form.clearErrors('root.server');
      setMessage('正在保存…');
      try {
        const result = await saveProfile(values, scenario);
        setSaved(result);
        if (!result.ok) {
          if (result.fieldErrors) {
            for (const [name, error] of Object.entries(result.fieldErrors)) {
              // 字段路径应与注册名一致；shouldFocus 依赖该字段实际提供的 focus ref。
              // setError 使错误进入 RHF，供左侧 FieldError、右侧 errors 和提交结果状态共享。
              form.setError(name as 'username' | 'email', {type: 'server', message: error}, {shouldFocus: true});
            }
            setMessage('保存未完成，请处理字段下方的服务端错误。');
          } else {
            // 没有具体字段的服务异常放到 root，单独显示在保存区域，方便调整后重试。
            form.setError('root.server', {type: 'server', message: result.message});
            setMessage('保存未完成，可调整提交场景后重试。');
          }
          return;
        }
        // 保存结果成为新的默认值；之后 reset() 应回到此次保存结果，而非首次加载结果。
        // API 返回 security.changePassword=false，条件密码字段因此卸载并注销。
        // 保留提交标记和次数，让 handleSubmit 完成收尾，避免回填顺便清掉提交记录。
        resetProfile(form, result.profile, {keepIsSubmitted: true, keepSubmitCount: true});
        setMessage(`保存成功 · ${result.savedAt}，已更新默认值并清理本地修改状态。`);
      } catch {
        form.setError('root.server', {type: 'server', message: '保存出现异常，请重试'});
        setMessage('保存未完成。');
      }
    },
    () => {
      setSaved(null);
      setMessage('校验未通过，请检查字段提示。');
    }
  );

  // isValid=true 仅代表校验通过，不代表外部上传/刷新已完成；保存按钮还需要这些互斥条件。
  const busy = isLoading || isSubmitting || refreshing || uploadingLogo;
  return (
    <div className="@container/advanced-form flex h-full min-h-0 w-full flex-col overflow-hidden! p-4 md:p-6">
      <FormProvider {...form}>
        <div className="grid min-h-0 flex-1 grid-rows-[repeat(2,minmax(0,1fr))] @4xl/advanced-form:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] @4xl/advanced-form:grid-rows-[minmax(0,1fr)]">
          <form
            noValidate
            onSubmit={(event) => {
              // 除禁用按钮外再守住表单提交入口，防止上传中通过 Enter 等方式提交旧 Logo 值。
              if (uploadingLogo) {
                event.preventDefault();
                setMessage('请等待 Logo 上传完成后再保存。');
                return;
              }
              void submit(event);
            }}
            className="min-h-0 min-w-0 overflow-y-auto overscroll-contain px-1 pb-4 @4xl/advanced-form:pr-6"
            aria-busy={busy}
          >
            <header className="mb-6">
              <h1 className="text-lg font-semibold">账户与企业资料设置</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                编辑账户、企业与联系资料，支持异步校验、字段联动和条件字段。数据仅在当前页面处理。
              </p>
            </header>
            {isLoading ? (
              <p role="status" className="text-muted-foreground py-8 text-sm">
                正在加载已有资料…
              </p>
            ) : (
              <fieldset disabled={isSubmitting} className="min-w-0">
                <ProfileFields onLogoUploadingChange={setUploadingLogo} />
              </fieldset>
            )}
            {form.formState.errors.root?.server?.message && (
              <p role="alert" className="text-destructive mt-5 text-sm">
                {form.formState.errors.root.server.message}
              </p>
            )}
            <p role="status" className="text-muted-foreground mt-5 text-sm">
              {message}
            </p>
            <div className="mt-4 flex items-center justify-end border-t pt-4">
              <Button type="submit" disabled={busy}>
                {isSubmitting ? '保存中…' : '保存资料'}
              </Button>
            </div>
          </form>
          <FormObserver
            form={form}
            refreshing={refreshing}
            uploadingLogo={uploadingLogo}
            onRefresh={refresh}
            scenario={scenario}
            onScenarioChange={setScenario}
            saved={saved}
          />
        </div>
      </FormProvider>
    </div>
  );
}
