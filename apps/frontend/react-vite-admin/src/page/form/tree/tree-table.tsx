import {memo, useMemo, type Dispatch, type SetStateAction} from 'react';
import {useMeasure} from 'react-use';
import type {UseFormReturn} from 'react-hook-form';
import type {ColumnDef, ExpandedState} from '@tanstack/react-table';
import {Button} from '@badnpm/ui';
import ExpandCell from '@/components/tanstack/expand-cell';
import TanstackTable from '@/components/tanstack/tanstack-table';
import type {FormSchema, TreeNode} from './schema';
import EditableCell from './editable-cell';

type Props = {
  nodes: TreeNode[];
  form: UseFormReturn<FormSchema>;
  expanded: ExpandedState;
  setExpanded: Dispatch<SetStateAction<ExpandedState>>;
  onAddChild: (id: string) => void;
  onDelete: (id: string) => void;
};

/** 表格作为独立 memo 边界，提交结果/提示更新不重建表格和编辑器。 */
function TreeTable({nodes, form, expanded, setExpanded, onAddChild, onDelete}: Props) {
  // flex-1 区域由父级布局分配剩余高度，与表格内容高度无关。
  // useMeasure 通过 ResizeObserver 监听此区域：工具栏换行、提交结果展开和窗口缩放都会更新。
  // 不测量表格自身，避免“表格高度影响测量 -> 再缩小表格”的尺寸反馈循环。
  const [measureRef, {height: remainingHeight}] = useMeasure<HTMLDivElement>();
  // 400px 是最小视口：剩余 450px 就使用 450px，空间不足时由页面滚动承载溢出内容。
  const tableHeight = Math.max(remainingHeight, 400);
  // useMeasure 的回调 ref 挂载后会触发更新，也确保公共表格内部滚动容器就绪后进入虚拟分支。
  const columns = useMemo<ColumnDef<TreeNode>[]>(
    () => [
      {accessorKey: 'label', header: '节点', size: 250, cell: (props) => <ExpandCell {...props} />},
      {id: 'id', header: 'ID', size: 100, cell: ({row}) => row.id},
      {id: 'type', header: '控件类型', size: 160, accessorFn: (node) => node.control.type},
      {
        id: 'control',
        header: '编辑值（必填）',
        size: 360,
        // 默认行 ID 会随位置变化；节点换位后重新挂载编辑器，恢复对应节点的值。
        cell: ({row}) => <EditableCell key={row.original.id} node={row.original} form={form} />,
      },
      {
        id: 'action',
        header: '操作',
        size: 200,
        cell: ({row}) => (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onAddChild(row.original.id);
                setExpanded((current) => (current === true ? true : {...current, [row.id]: true}));
              }}
            >
              添加子节点
            </Button>
            <Button type="button" variant="destructive" onClick={() => onDelete(row.original.id)}>
              删除
            </Button>
          </div>
        ),
      },
    ],
    [form, onAddChild, onDelete, setExpanded]
  );

  return (
    <div ref={measureRef} className="min-h-0 flex-1">
      <div className="overflow-x-auto" style={{maxHeight: tableHeight}}>
        <TanstackTable<TreeNode>
          virtual
          height={tableHeight}
          data={nodes}
          columns={columns}
          getSubRows={(node) => node.children}
          state={{expanded}}
          onExpandedChange={setExpanded}
          autoResetExpanded={false}
        />
      </div>
    </div>
  );
}
export default memo(TreeTable);
