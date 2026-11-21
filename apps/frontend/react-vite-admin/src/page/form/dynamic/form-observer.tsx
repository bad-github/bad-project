import {useState} from 'react';
import {useFormState, useWatch, type UseFieldArrayReturn, type UseFormReturn} from 'react-hook-form';
import {ChevronDownIcon} from 'lucide-react';

import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  NativeSelect,
  NativeSelectOption,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  BadTooltip,
} from '@badnpm/ui';
import IconQuestion from '@/assets/svg/circle-question-mark.svg?react';
import {
  MAX_CONTACTS,
  createContact,
  createExampleContacts,
  getContactExample,
  errorMessages,
  type ContactValues,
} from './form-model';

type Props = {
  form: UseFormReturn<ContactValues>;
  array: UseFieldArrayReturn<ContactValues, 'contacts'>;
  submitted: ContactValues | null;
  onMessage: (message: string) => void;
  onReset: () => void;
};

function DataBlock({title, value, defaultOpen = false}: {title: string; value: unknown; defaultOpen?: boolean}) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="min-w-0 py-3">
      <h3>
        <CollapsibleTrigger className="group hover:text-primary flex w-full items-center justify-between gap-2 text-left text-sm font-medium">
          {title}
          <ChevronDownIcon
            aria-hidden="true"
            className="size-4 shrink-0 transition-transform group-aria-expanded:rotate-180"
          />
        </CollapsibleTrigger>
      </h3>
      <CollapsibleContent>
        <pre className="bg-muted mt-3 rounded-md p-3 text-xs leading-relaxed break-all whitespace-pre-wrap">
          {value == null ? '暂无数据' : JSON.stringify(value, null, 2)}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function FormObserver({form, array, submitted, onMessage, onReset}: Props) {
  // useWatch 提供实时输入；fields 只描述数组结构和初始/操作时的数据，不用于读取实时值。
  const values = useWatch({control: form.control});
  const state = useFormState({control: form.control});
  const [selectedId, setSelectedId] = useState<number | null>(() => array.fields[0]?.contactId ?? null);
  const [snapshot, setSnapshot] = useState<ContactValues | null>(null);
  const count = array.fields.length;
  // 选项保存稳定业务 ID；调用 RHF 数组 API 时才查找它当前的索引。
  // 移动或插入不会改变目标联系人；目标被删除/替换时回退到当前第一位。
  const selectedIndex = array.fields.findIndex((field) => field.contactId === selectedId);
  const target = selectedIndex < 0 ? 0 : selectedIndex;
  const targetId = array.fields[target]?.contactId;
  // 列表变化使原目标失效时，同步调整本组件的选择状态；条件保证下一次渲染不会重复更新。
  // 回退 ID 也需保存，否则后续重排会继续跟随第一行，而非这位联系人。
  if (selectedId !== (targetId ?? null)) setSelectedId(targetId ?? null);
  const messages = errorMessages(state.errors);
  const arrayMessage = messages['contacts.root'] ?? messages.contacts;

  const actions = [
    {
      label: '末尾新增（不自动聚焦）',
      disabled: count >= MAX_CONTACTS,
      run: () => {
        // API 入口创建并填充预设值；列表末尾的“新增”保持空白。两种入口均不自动聚焦。
        const contact = createContact();
        array.append({...contact, ...getContactExample(contact.contactId)}, {shouldFocus: false});
        return 'append：末尾新增联系人并填充姓名、邮箱，不自动聚焦。';
      },
    },
    {
      label: '批量新增（不自动聚焦）',
      disabled: count > MAX_CONTACTS - 2,
      run: () => {
        // 一次传数组，不连续堆叠多个 append，减少结构更新及聚焦竞争。
        array.append([createContact(), createContact()], {shouldFocus: false});
        return 'append([...])：一次新增两位联系人。';
      },
    },
    {
      label: '开头新增（自动聚焦）',
      disabled: count >= MAX_CONTACTS,
      run: () => {
        array.prepend(createContact());
        return 'prepend：新增到开头，原有联系人的索引后移。';
      },
    },
    {
      label: '在选中行前插入（自动聚焦）',
      disabled: !count || count >= MAX_CONTACTS,
      run: () => {
        array.insert(target, createContact());
        return 'insert：在选中联系人前插入完整空白联系人。';
      },
    },
    {
      label: '设置选中行姓名',
      disabled: !count,
      run: () => {
        // 更新叶子字段不会重新挂载整行；三个选项独立控制 dirty、touched、校验。
        form.setValue(`contacts.${target}.name`, '王五', {shouldDirty: true, shouldTouch: true, shouldValidate: true});
        return 'setValue：只改姓名，保留该行 field.id 和输入框实例。';
      },
    },
    {
      label: '更新选中整行',
      disabled: !count,
      run: () => {
        // 用 getValues 读取实时行，不能从 fields 拿可能过期的输入值。
        // update 必须传完整对象，会生成新的 field.id、重新挂载该行，焦点/本地组件状态可能丢失。
        array.update(target, {...form.getValues(`contacts.${target}`), name: '王五'});
        return 'update：更新整行并重新挂载，观察该行 field.id 的变化。';
      },
    },
    {
      label: '填充为 2 人',
      disabled: false,
      run: () => {
        // replace 改整份数组并重新生成所有渲染 id，但不把示例设为新的默认值。
        // 不使用 setValue("contacts", ...) 替代字段数组的结构操作。
        array.replace(createExampleContacts());
        return 'replace：当前列表已填充为 2 位预设联系人，默认值基准未更新。';
      },
    },
    {
      label: '清空联系人',
      disabled: !count,
      run: () => {
        // remove() 无参数删除全部；允许空列表供学习，但数量校验会阻止保存。
        array.remove();
        return 'remove()：已清空，至少新增一位联系人后才能保存。';
      },
    },
    {
      label: '恢复初始表单',
      disabled: false,
      run: () => {
        // 无参数 reset 恢复最初的一行空白联系人，并清理错误、dirty、touched 和提交状态。
        // 它会重建数组渲染 id；React 自己保存的快照/提交结果需要额外清理。
        form.reset();
        setSnapshot(null);
        onReset();
        setSelectedId(null);
        return 'reset：恢复初始默认值，同时清理交互状态与页面快照。';
      },
    },
  ];
  const statuses = [
    {
      name: 'isDirty',
      value: state.isDirty,
      description: '当前数组值是否与初始默认值不同。新增、删除、改值或重排均可能使其变为 true；恢复初值可变回 false。',
    },
    {
      name: 'isValid',
      value: state.isValid,
      description: '整张表单是否符合校验规则，包括人数、必填项、邮箱格式及邮箱唯一性。订阅它可能触发整表有效性检查。',
    },
    {
      name: 'isSubmitting',
      value: state.isSubmitting,
      description: '是否正在执行提交校验和提交回调。本页保存于内存，提交过程很快结束。',
    },
    {
      name: 'isSubmitted',
      value: state.isSubmitted,
      description: '是否完成过提交尝试，校验失败也算。默认 reset 会清除此状态。',
    },
    {
      name: 'isSubmitSuccessful',
      value: state.isSubmitSuccessful,
      description: '最近一次提交通过校验，且提交回调未抛出错误。后续编辑不会自动清除该历史结果。',
    },
    {
      name: 'submitCount',
      value: state.submitCount,
      description: '提交尝试次数，校验失败也计数。trigger 只校验，不增加此值。',
    },
  ];

  return (
    <aside
      aria-label="表单观察"
      className="min-h-0 min-w-0 overflow-y-auto overscroll-contain border-t p-4 @4xl/dynamic-form:border-t-0 @4xl/dynamic-form:border-l @4xl/dynamic-form:py-0 @4xl/dynamic-form:pl-6"
    >
      <h2 className="font-medium">表单观察</h2>
      <p className="text-muted-foreground mt-1 text-xs">实时观察数组值、渲染标识和交互状态。</p>
      <section aria-label="API 操作" className="mt-5 border-y py-4">
        <h3 className="mb-3 text-sm font-medium">
          API 操作 · {count} / {MAX_CONTACTS} 位
        </h3>
        <label htmlFor="contact-target" className="mb-2 block text-xs">
          操作目标（联系人 ID）
        </label>
        <NativeSelect
          id="contact-target"
          className="mb-3 w-full"
          value={targetId === undefined ? '' : String(targetId)}
          disabled={!count || state.isSubmitting}
          onChange={(event) => setSelectedId(Number(event.target.value))}
        >
          {!count && <NativeSelectOption value="">暂无联系人</NativeSelectOption>}
          {array.fields.map((field) => (
            <NativeSelectOption key={field.id} value={String(field.contactId)}>
              联系人{field.contactId}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              type="button"
              size="sm"
              variant="outline"
              disabled={state.isSubmitting || action.disabled}
              onClick={() => onMessage(action.run())}
            >
              {action.label}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={state.isSubmitting}
            onClick={async () => {
              // 整表校验确保两行邮箱冲突同时更新；单独 trigger 某个邮箱未必会更新另一行错误。
              const valid = await form.trigger(undefined, {shouldFocus: true, shouldTouch: true});
              onMessage(valid ? '全部校验通过，可以保存。' : '校验未通过，请检查字段及联系人数量。');
            }}
          >
            校验全部
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={state.isSubmitting}
            onClick={() => {
              // getValues 不建立订阅；克隆后得到固定时刻快照，后续编辑不影响它。
              setSnapshot(structuredClone(form.getValues()));
              onMessage('已读取当前联系人快照。');
            }}
          >
            读取快照
          </Button>
        </div>
        {arrayMessage && (
          <p role="alert" className="text-destructive mt-3 text-sm">
            {arrayMessage}
          </p>
        )}
        <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
          单行删除、上移和下移位于左侧。清空后无法保存；恢复初始表单会清理全部交互状态。
        </p>
      </section>
      <Table aria-label="表单状态" className="my-5 text-xs">
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
      <div className="divide-y">
        <DataBlock title="当前值 · useWatch" value={values} defaultOpen />
        {/* 刻意只展示结构标识：fields 本身不是输入值的实时镜像。 */}
        <DataBlock
          title="数组结构 · fields"
          value={array.fields.map((field, index) => ({index, contactId: field.contactId, fieldId: field.id}))}
        />
        <DataBlock title="错误 · errors" value={messages} />
        <DataBlock title="已修改字段 · dirtyFields" value={state.dirtyFields} />
        <DataBlock title="已触碰字段 · touchedFields" value={state.touchedFields} />
        <DataBlock title="初始基准 · defaultValues" value={state.defaultValues} />
        <DataBlock title="读取快照 · getValues" value={snapshot} />
        <DataBlock title="最近保存 · handleSubmit" value={submitted} />
      </div>
    </aside>
  );
}
