import {useCallback, useMemo, useRef, useState, type SubmitEvent} from 'react';
import {FormProvider, useForm, type Resolver} from 'react-hook-form';
import type {ExpandedState} from '@tanstack/react-table';
import type {ControlType, FormSchema} from './schema';
import {createInitialTree, serializeTree, type SubmittedNode} from './tool';
import {createTreeResolver, type ValidationContext} from './resolver';
import useTreeAction from './use-tree-action';
import TreeTable from './tree-table';
import FormToolbar from './form-toolbar';

export default function TreeForm() {
  const [initial] = useState(createInitialTree);
  const [nodes, setNodes] = useState(initial.nodes);
  const [expanded, setExpanded] = useState<ExpandedState>(true);
  const [submitted, setSubmitted] = useState<SubmittedNode[] | null>(null);
  const [submitMessage, setSubmitMessage] = useState('');
  const selectedType = useRef<ControlType>('input');
  const validationContext = useRef<ValidationContext>({validateAll: false});
  const resolver = useMemo<Resolver<FormSchema>>(() => {
    const resolve = createTreeResolver(nodes);
    // ref 只在 RHF 发起校验时读取，不在 React render 阶段读取或订阅可变状态。
    return (values, _context, options) => resolve(values, validationContext.current, options);
  }, [nodes]);
  const form = useForm<FormSchema>({
    mode: 'onChange',
    resolver,
    defaultValues: initial.form,
    // 虚拟滚动/折叠只卸载 UI，不删除值；真正删除时显式 unregister 整棵子树。
    shouldUnregister: false,
    // 屏幕外的错误字段没有可聚焦 DOM。先展开并显示提示，避免 RHF 聚焦已卸载的旧 ref。
    shouldFocusError: false,
  });
  const {addNode, deleteNode} = useTreeAction(nodes, setNodes, form);
  const selectType = useCallback((type: ControlType) => {
    selectedType.current = type;
  }, []);
  const addChild = useCallback((id: string) => addNode(selectedType.current, id), [addNode]);

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    // 必须显式切换整表校验：屏幕外未注册的节点、折叠节点也需要校验。
    // 标志只在提交过程中有效，日常输入仍按 resolver options.names 增量校验。
    validationContext.current.validateAll = true;
    try {
      await form.handleSubmit(
        (data) => {
          const result = serializeTree(nodes, data.values);
          setSubmitted(result);
          setSubmitMessage('校验通过，已生成提交结果。');
          console.log('tree form submit', result);
        },
        (errors) => {
          setExpanded(true);
          const count = Object.keys(errors.values ?? {}).length;
          setSubmitMessage(`校验未通过，${count} 个字段存在错误，已展开全部节点，请滚动查看。`);
          // 公共表格尚未暴露 scrollToIndex，不通过猜测像素或访问私有 DOM 来伪造定位。
          // 后续表格提供公开滚动接口后，再接入“滚动到错误行 -> 挂载 -> 聚焦”。
        }
      )(event);
    } finally {
      validationContext.current.validateAll = false;
    }
  };

  return (
    <FormProvider {...form}>
      <form className="flex h-full min-h-0 flex-col gap-3" noValidate onSubmit={submit}>
        {/* 上方内容保持自然高度，表格测量区通过 flex-1 获得剩余空间。 */}
        <div className="flex shrink-0 flex-col gap-3">
          <FormToolbar onSelectType={selectType} onAdd={addNode} />
          <p className="text-muted-foreground text-sm">
            支持指定类型添加、任意层级增删；滚动或折叠保留输入，删除清理整棵子树。
          </p>
          <p role="status" className="text-sm">
            {submitMessage}
          </p>
          {submitted && (
            <details open>
              <summary className="cursor-pointer text-sm">最近一次成功提交的树形数据</summary>
              <pre className="bg-muted mt-2 max-h-96 overflow-auto rounded-md p-3 text-xs">
                {JSON.stringify(submitted, null, 2)}
              </pre>
            </details>
          )}
        </div>
        <TreeTable
          nodes={nodes}
          form={form}
          expanded={expanded}
          setExpanded={setExpanded}
          onAddChild={addChild}
          onDelete={deleteNode}
        />
      </form>
    </FormProvider>
  );
}
