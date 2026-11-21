import {useState} from 'react';
import {useFormState, useWatch, type UseFormReturn} from 'react-hook-form';
import {ChevronDownIcon} from 'lucide-react';

import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  BadTooltip,
} from '@badnpm/ui';
import IconQuestion from '@/assets/svg/circle-question-mark.svg?react';
import {createDefaultValues, previewValues, type RegistrationValues} from './form-model';

export type FormSnapshot = {
  values: RegistrationValues;
  errors: Record<string, string>;
  name: {invalid: boolean; isDirty: boolean; isTouched: boolean; isValidating: boolean};
};

type Props = {
  form: UseFormReturn<RegistrationValues>;
  snapshot: FormSnapshot | null;
  submitted: RegistrationValues | null;
  onFillExample: () => void;
  onReadSnapshot: () => void;
  onValidate: () => Promise<void>;
  onReset: () => void;
};

function DataBlock({
  title,
  value,
  empty,
  defaultOpen = false,
}: {
  title: string;
  value: unknown;
  empty?: string;
  defaultOpen?: boolean;
}) {
  return (
    // 折叠只控制展示，父组件的订阅仍继续更新，不会因收起而停止。
    <Collapsible defaultOpen={defaultOpen} className="min-w-0 py-3">
      <h3>
        <CollapsibleTrigger className="group hover:text-primary focus-visible:ring-ring flex w-full items-center justify-between gap-2 rounded-sm text-left text-sm font-medium outline-none focus-visible:ring-2">
          <span>{title}</span>
          <ChevronDownIcon
            aria-hidden="true"
            className="text-muted-foreground size-4 shrink-0 transition-transform group-aria-expanded:rotate-180"
          />
        </CollapsibleTrigger>
      </h3>
      <CollapsibleContent>
        <pre className="bg-muted text-foreground mt-3 rounded-md p-3 text-xs leading-relaxed break-all whitespace-pre-wrap">
          {value === null ? empty : JSON.stringify(value, null, 2)}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * 左右共享 control，但把全表值订阅放在右侧，避免普通输入每次变化都更新页面根组件。
 * 读取 isValid 会要求 RHF 在适当时机重算整表有效性；异步规则需要复用结果/合并请求，
 * 高级页专门演示了这一点。状态观察并非完全没有校验开销。
 */
export default function FormObserver({
  form,
  snapshot,
  submitted,
  onFillExample,
  onReadSnapshot,
  onValidate,
  onReset,
}: Props) {
  const [actionMessage, setActionMessage] = useState('');
  // 不传 name 即订阅整表；这里是实时数据，getValues 则只读取调用时的值。
  const watched = useWatch({control: form.control});
  const current = {...createDefaultValues(), ...watched};
  // 按属性读取建立订阅；下方表格与 JSON 读取 errors、dirtyFields、touchedFields 等。
  const state = useFormState({control: form.control});
  const errors = Object.fromEntries(
    Object.entries(state.errors).flatMap(([name, error]) => (error?.message ? [[name, error.message]] : []))
  );
  const statuses = [
    {
      name: 'isDirty',
      value: state.isDirty,
      description: '当前表单值是否与默认值不同。修改后为 true，恢复为默认值后可变回 false；不表示是否获得过焦点。',
    },
    {
      name: 'isValid',
      value: state.isValid,
      description:
        '整个表单是否通过校验。本页失焦、手动校验或提交时更新；clearErrors 只清除错误提示，不会主动重新计算此状态。',
    },
    {
      name: 'isSubmitting',
      value: state.isSubmitting,
      description: '是否正在执行提交过程，包括校验与等待异步提交回调。提交期间为 true，结束后恢复为 false。',
    },
    {
      name: 'isSubmitted',
      value: state.isSubmitted,
      description: '是否已经完成过一次提交尝试，包括校验未通过的情况。之后保持为 true，默认 reset() 会将其清除。',
    },
    {
      name: 'isSubmitSuccessful',
      value: state.isSubmitSuccessful,
      description: '最近一次提交是否通过校验，且提交回调未抛出错误。',
    },
    {
      name: 'submitCount',
      value: state.submitCount,
      description: '提交尝试次数，校验失败的提交也计入。单独调用 trigger 校验不会增加次数，默认 reset() 会将其归零。',
    },
  ];

  return (
    <aside
      aria-label="表单观察"
      className="min-h-0 min-w-0 overflow-y-auto overscroll-contain border-t p-4 @4xl/basic-form:border-t-0 @4xl/basic-form:border-l @4xl/basic-form:py-0 @4xl/basic-form:pl-6"
    >
      <h2 className="font-medium">表单观察</h2>
      <p className="text-muted-foreground mt-1 text-xs">值与状态实时更新，密码和验证码已脱敏。</p>
      <section aria-label="API 操作" className="mt-5 border-y py-4">
        <h3 className="mb-3 text-sm font-medium">API 操作</h3>
        <div className="flex flex-wrap gap-2">
          {/* 页面级操作仍由父组件处理，以保留快照、最近提交和提示信息的统一清理逻辑。 */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={state.isSubmitting}
            onClick={() => {
              onFillExample();
              setActionMessage('已填入可直接提交的示例数据。');
            }}
          >
            填入示例
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={state.isSubmitting}
            onClick={() => {
              onReadSnapshot();
              setActionMessage('已读取当前快照，后续输入不会改变这份快照。');
            }}
          >
            读取快照
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={state.isSubmitting}
            onClick={async () => {
              await onValidate();
              setActionMessage('已校验整张表单，请查看字段提示与表单状态。');
            }}
          >
            校验表单
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={state.isSubmitting}
            onClick={() => {
              onReset();
              setActionMessage('已恢复默认值，并清理错误和交互状态。');
            }}
          >
            重置
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={state.isSubmitting}
            onClick={() => {
              // 只聚焦/选择文本，不改值或 dirty；字段必须已挂载并提供可聚焦 ref。
              form.setFocus('name', {shouldSelect: true});
              setActionMessage('setFocus：已聚焦并选中姓名。');
            }}
          >
            聚焦姓名
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={state.isSubmitting}
            onClick={() => {
              // 只恢复姓名及其状态，但整表 isDirty/isValid 可能重算。
              // 若额外传 defaultValue，还会改写此字段之后用于 reset 的默认值。
              form.resetField('name');
              setActionMessage('resetField：已恢复姓名初值，并清理该字段的错误、dirty 和 touched 状态。');
            }}
          >
            重置姓名
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={state.isSubmitting}
            onClick={() => {
              // 三个选项独立控制校验、dirty 比较和 touched；程序赋值不默认等于用户交互。
              form.setValue('name', '张三', {shouldValidate: true, shouldDirty: true, shouldTouch: true});
              setActionMessage('setValue：姓名已设为张三，同时校验并更新 dirty、touched 状态。');
            }}
          >
            设置姓名
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={state.isSubmitting || state.isValidating}
            onClick={async () => {
              // 字符串 name 指定单字段校验，但订阅 isValid 仍可能间接引发整表有效性检查。
              const valid = await form.trigger('email', {shouldFocus: true, shouldTouch: true});
              setActionMessage(
                valid
                  ? 'trigger：邮箱校验通过。'
                  : `trigger：${form.getFieldState('email').error?.message ?? '邮箱校验未通过'}`
              );
            }}
          >
            仅校验邮箱
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={state.isSubmitting}
            onClick={() => {
              // 手动绑定服务端字段错误，shouldFocus 使用注册 ref；不会改写校验规则。
              // 注册字段后续按规则校验通过时，该手动错误可以被清除。
              form.setError('email', {type: 'server', message: '该邮箱已被注册，请更换邮箱'}, {shouldFocus: true});
              setActionMessage('setError：已为邮箱设置占用错误。');
            }}
          >
            设置邮箱占用错误
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={state.isSubmitting}
            onClick={() => {
              // 只删错误提示，不改值/规则，也不主动把 isValid 改成 true；判断正确性仍需校验。
              form.clearErrors('email');
              setActionMessage('clearErrors：已清除邮箱错误提示；邮箱值和校验规则保持不变，不会重新计算 isValid。');
            }}
          >
            清除邮箱错误
          </Button>
        </div>
        <p role="status" aria-live="polite" className="text-muted-foreground mt-3 text-xs leading-relaxed">
          {actionMessage || '点击操作，观察左侧字段与下方值、错误和交互状态的变化。'}
        </p>
      </section>
      <div className="my-5">
        <Table aria-label="表单状态" className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead scope="col">状态</TableHead>
              <TableHead scope="col" className="text-right">
                当前值
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statuses.map(({name, value, description}) => (
              <TableRow key={name}>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono">{name}</span>
                    <BadTooltip
                      trigger={{
                        type: 'button',
                        'aria-label': `${name} 的含义`,
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
                  className={`text-right font-mono ${value === true ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
                >
                  {String(value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="divide-y">
        <DataBlock title="当前值 · useWatch" value={previewValues(current)} defaultOpen />
        <DataBlock title="错误 · errors" value={errors} />
        <DataBlock title="已修改字段 · dirtyFields" value={state.dirtyFields} />
        <DataBlock title="已触碰字段 · touchedFields" value={state.touchedFields} />
        <DataBlock
          title="读取快照 · getValues / getErrors"
          value={snapshot}
          empty="点击 API 操作中的“读取快照”获取当时的值、错误和姓名状态。"
        />
        <DataBlock title="最近提交 · handleSubmit" value={submitted} empty="校验通过并完成提交后显示。" />
      </div>
    </aside>
  );
}
