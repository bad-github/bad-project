import {useState} from 'react';
import {useFormState, useWatch, type Control, type UseFormReturn} from 'react-hook-form';
import {ChevronDownIcon} from 'lucide-react';

import {
  Button,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Label,
  NativeSelect,
  NativeSelectOption,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  BadTooltip,
} from '@badnpm/ui';
import IconQuestion from '@/assets/svg/circle-question-mark.svg?react';
import type {saveProfile} from './api';
import {createEmptyValues, errorMessages, previewProfile, type ProfileValues, type SubmitScenario} from './form-model';
import useDraft from './use-draft';
import {resetProfile} from './form-actions';

const statusDefinitions = [
  {
    key: 'isLoading',
    description: '是否正在加载异步 defaultValues。本页首次加载资料期间为 true，手动刷新使用单独的 refreshing 状态。',
  },
  {key: 'isValidating', description: '是否有正在进行的校验。用户名异步查重期间为 true；具体字段见 validatingFields。'},
  {key: 'isDirty', description: '当前值是否与默认值不同。保留修改的刷新会更新默认值；成功保存后以保存结果重置。'},
  {key: 'isValid', description: '整个表单是否通过校验。清除错误提示不会主动重新计算此状态。'},
  {key: 'isSubmitting', description: '是否正在提交，包括校验与等待保存接口返回。'},
  {key: 'isSubmitted', description: '是否已完成过提交尝试，包括校验失败的尝试；普通 reset 会清除此状态。'},
  {
    key: 'isSubmitSuccessful',
    description:
      '最近一次提交是否通过校验且回调未抛出错误。通过 setError 标记的服务端错误也会影响此状态，保存结果见下方 JSON。',
  },
  {key: 'submitCount', description: '提交尝试次数，校验失败也计入。手动 trigger 不增加次数。'},
] as const;

function DataBlock({title, value, defaultOpen = false}: {title: string; value: unknown; defaultOpen?: boolean}) {
  // 收起只影响 JSON 展示，不取消本组件外部的表单订阅，也不清空其值。
  return (
    <Collapsible defaultOpen={defaultOpen} className="min-w-0 py-3">
      <h3>
        <CollapsibleTrigger className="group hover:text-primary focus-visible:ring-ring flex w-full items-center justify-between gap-2 rounded-sm text-left text-sm font-medium outline-none focus-visible:ring-2">
          <span>{title}</span>
          <ChevronDownIcon
            aria-hidden="true"
            className="size-4 shrink-0 transition-transform group-aria-expanded:rotate-180"
          />
        </CollapsibleTrigger>
      </h3>
      <CollapsibleContent>
        <pre className="bg-muted mt-3 rounded-md p-3 text-xs leading-relaxed break-all whitespace-pre-wrap">
          {value === null ? '暂无数据' : JSON.stringify(value, null, 2)}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}

function Summary({control}: {control: Control<ProfileValues>}) {
  // compute 将表单值派生成字符串；此订阅按计算结果比较，结果不变时可避免这条订阅引发更新。
  // 它不会写回字段，不能代替省份切换时明确执行 setValue('address.city', '')。
  const summary = useWatch({
    control,
    compute: (values: ProfileValues) =>
      `${values.identity === 'company' ? '企业账户' : '个人账户'} · ${values.address?.city || '未选择城市'} · ${values.security?.changePassword ? '计划修改密码' : '保留原密码'}`,
  });
  return <p className="text-muted-foreground mb-3 text-xs">派生摘要 · {summary}</p>;
}

/**
 * 观察区共享主表单，不创建第二个 useForm。实时值、状态与手动快照是三种不同机制：
 * useWatch 订阅值；useFormState 订阅被读取的状态；getValues/getErrors 只读取调用时数据。
 * isValid 的读取会触发 RHF 跟踪整表有效性，异步用户名校验必须处理重复调用。
 */
export default function FormObserver({
  form,
  refreshing,
  uploadingLogo,
  onRefresh,
  scenario,
  onScenarioChange,
  saved,
}: {
  form: UseFormReturn<ProfileValues>;
  refreshing: boolean;
  uploadingLogo: boolean;
  onRefresh: (keepDirty: boolean) => Promise<void>;
  scenario: SubmitScenario;
  onScenarioChange: (scenario: SubmitScenario) => void;
  saved: Awaited<ReturnType<typeof saveProfile>> | null;
}) {
  // 这些是操作选项，不注册进业务表单，因此切换开关不会修改 dirtyFields 或提交载荷。
  const [keepDirty, setKeepDirty] = useState(true);
  const [draftEnabled, setDraftEnabled] = useState(false);
  const [snapshot, setSnapshot] = useState<unknown>(null);
  const [message, setMessage] = useState('');
  // 读取 dirtyFields 也使 reset(..., {keepDirtyValues:true}) 有可用的修改状态订阅。
  const state = useFormState({control: form.control});
  const watched = useWatch({control: form.control});
  // 初值加载/字段注销期间 useWatch 可能返回部分对象，补空值仅用于安全展示，
  // 不会 setValue 回表单。排查实际提交缺值应看 getValues 快照，不能只看输入框文本。
  const empty = createEmptyValues();
  const current = {
    ...empty,
    ...watched,
    address: {...empty.address, ...watched.address},
    security: {...empty.security, ...watched.security},
  };
  // isLoading 只涵盖异步 defaultValues，isSubmitting 只涵盖 RHF 提交流程。
  // 手动刷新与自定义控件上传需要显式加入互斥条件，否则可能保存尚未上传完成的旧值。
  const busy = state.isLoading || state.isSubmitting || refreshing || uploadingLogo;
  // 上传只在成功后提交新值，草稿订阅继续接收这次提交。
  const draft = useDraft(form, draftEnabled && !state.isLoading && !state.isSubmitting && !refreshing);

  return (
    <aside
      aria-label="高级表单观察"
      className="min-h-0 min-w-0 overflow-y-auto overscroll-contain border-t p-4 @4xl/advanced-form:border-t-0 @4xl/advanced-form:border-l @4xl/advanced-form:py-0 @4xl/advanced-form:pl-6"
    >
      <h2 className="font-medium">表单观察</h2>
      <p className="text-muted-foreground mt-1 text-xs">值与状态实时更新，密码已脱敏。</p>
      <section aria-label="API 操作" className="my-5 space-y-4 border-y py-4">
        <h3 className="text-sm font-medium">API 操作</h3>
        <div className="flex items-center gap-2">
          <Checkbox id="advanced-keep-dirty" checked={keepDirty} onCheckedChange={setKeepDirty} disabled={busy} />
          <Label htmlFor="advanced-keep-dirty" className="text-xs">
            刷新时保留本地修改字段
          </Label>
          <BadTooltip
            trigger={{
              type: 'button',
              'aria-label': '刷新时保留本地修改字段的含义',
              className:
                'text-muted-foreground hover:text-primary focus-visible:ring-ring inline-flex size-5 shrink-0 cursor-help items-center justify-center rounded-sm outline-none focus-visible:ring-2',
              children: <IconQuestion aria-hidden="true" className="size-3.5" />,
            }}
            content={{
              children:
                '勾选后刷新资料，会保留 dirtyFields 标记的已修改字段，只更新未修改的字段。例如修改了用户名，刷新后用户名保留，未修改的邮箱和地址更新。仅聚焦不算修改。取消勾选后，新资料会覆盖整个表单，包括本地修改。',
              className: 'max-w-xs whitespace-normal break-words leading-relaxed',
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => onRefresh(keepDirty)}>
            {refreshing ? '刷新中…' : '刷新服务端资料'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => {
              // 恢复最近一次刷新/保存的默认值，并使用 keepFieldsRef 同步已挂载字段。
              // RHF 不负责清理我们自己保存的 React 快照状态。
              resetProfile(form);
              setSnapshot(null);
              setMessage('已恢复到最近一次加载或保存的默认值。');
            }}
          >
            重置本地修改
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy || state.isValidating}
            onClick={async () => {
              // 全表校验并更新错误/触碰状态；不执行保存回调，也不增加 submitCount。
              const valid = await form.trigger(undefined, {shouldFocus: true, shouldTouch: true});
              setMessage(valid ? '全部字段校验通过。' : '校验未通过，请查看左侧提示。');
            }}
          >
            校验全部
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy || state.isValidating}
            onClick={async () => {
              // 单字段 trigger 控制目标错误与聚焦，Zod resolver 仍可能运行整份 schema。
              // 名字未变时查重函数复用结果，点击此按钮不保证一定发出一个新请求。
              const valid = await form.trigger('username', {shouldFocus: true, shouldTouch: true});
              setMessage(valid ? '用户名可用。' : (form.getFieldState('username').error?.message ?? '校验失败'));
            }}
          >
            仅查重用户名
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => {
              // 按需读取不创建订阅；复制/脱敏后放进 React 状态，后续输入不会改这份快照。
              // FieldError.ref 不进入 JSON，避免 DOM 引用与循环结构。
              setSnapshot({
                values: previewProfile(form.getValues()),
                errors: errorMessages(form.getErrors()),
                username: {
                  invalid: form.getFieldState('username').invalid,
                  isDirty: form.getFieldState('username').isDirty,
                  isTouched: form.getFieldState('username').isTouched,
                  isValidating: form.getFieldState('username').isValidating,
                },
              });
              setMessage('已读取不可随输入变化的脱敏快照。');
            }}
          >
            读取快照
          </Button>
        </div>
        <p role="status" className="text-muted-foreground text-xs leading-relaxed">
          {message || '先修改一个字段，再刷新资料，观察 keepDirtyValues 的效果。'}
        </p>
        <div className="space-y-2">
          <Label htmlFor="advanced-scenario" className="text-xs">
            提交场景
          </Label>
          <NativeSelect
            id="advanced-scenario"
            value={scenario}
            onChange={(event) => onScenarioChange(event.target.value as SubmitScenario)}
            disabled={busy}
            className="w-full"
          >
            <NativeSelectOption value="success">正常结果（邮箱仍检查占用）</NativeSelectOption>
            <NativeSelectOption value="email-conflict">邮箱冲突 · 字段错误</NativeSelectOption>
            <NativeSelectOption value="server-error">服务异常 · 全局错误</NativeSelectOption>
          </NativeSelect>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="advanced-draft" checked={draftEnabled} onCheckedChange={setDraftEnabled} disabled={busy} />
          <Label htmlFor="advanced-draft" className="text-xs">
            自动保存草稿
          </Label>
        </div>
        <p role="status" className="text-muted-foreground text-xs">
          subscribe + 800ms 防抖 · {draft.status}
        </p>
      </section>
      <Summary control={form.control} />
      <Table aria-label="高级表单状态" className="text-xs">
        <TableHeader>
          <TableRow>
            <TableHead scope="col">状态</TableHead>
            <TableHead scope="col" className="text-right">
              当前值
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {statusDefinitions.map(({key, description}) => (
            <TableRow key={key}>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono">{key}</span>
                  <BadTooltip
                    trigger={{
                      type: 'button',
                      'aria-label': `${key} 的含义`,
                      className:
                        'text-muted-foreground hover:text-primary focus-visible:ring-ring inline-flex size-5 shrink-0 cursor-help items-center justify-center rounded-sm outline-none focus-visible:ring-2',
                      children: <IconQuestion aria-hidden="true" className="size-3.5" />,
                    }}
                    content={{
                      children: description,
                      className: 'max-w-xs whitespace-normal break-words leading-relaxed',
                    }}
                  />
                </div>
              </TableCell>
              <TableCell
                className={`text-right font-mono ${state[key] === true ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
              >
                {String(state[key])}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-3 divide-y">
        {/* 所有观察入口都使用展示副本，不输出原始密码或 File 内容，也不能拿副本重新回填。 */}
        <DataBlock title="当前值 · useWatch" value={previewProfile(current)} defaultOpen />
        <DataBlock title="错误 · errors" value={errorMessages(state.errors)} />
        <DataBlock title="校验中的字段 · validatingFields" value={state.validatingFields} />
        <DataBlock title="已修改字段 · dirtyFields" value={state.dirtyFields} />
        <DataBlock title="已触碰字段 · touchedFields" value={state.touchedFields} />
        <DataBlock
          title="默认值 · defaultValues"
          value={
            state.defaultValues
              ? previewProfile({
                  ...empty,
                  ...state.defaultValues,
                  address: {...empty.address, ...state.defaultValues.address},
                  security: {...empty.security, ...state.defaultValues.security},
                })
              : null
          }
        />
        <DataBlock title="读取快照 · getValues / getFieldState" value={snapshot} />
        <DataBlock title="保存结果" value={saved?.ok ? {...saved, profile: previewProfile(saved.profile)} : saved} />
        <DataBlock title="草稿 · subscribe" value={draft.result} />
      </div>
    </aside>
  );
}
