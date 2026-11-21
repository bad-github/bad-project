import {Button, BadTooltip} from '@badnpm/ui';
import {useTranslation} from 'react-i18next';
import {type Node, useReactFlow} from '@xyflow/react';
import {GripHorizontalIcon, XIcon} from 'lucide-react';
import IconQuestion from '@/assets/svg/circle-question-mark.svg?react';

type TProps = {
  style?: React.CSSProperties;
} & Node;
export default function NodeCard(props: TProps) {
  const {t} = useTranslation();
  const {deleteElements, getNodes, getEdges} = useReactFlow();
  const {id, type, style} = props;
  const data = props.data as any;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // 会自动删除这个节点的连线
    await deleteElements({nodes: [{id}]});
    // 用await后可以打印剩下的信息
    console.log(getNodes(), getEdges(), 'delete end');
  };

  return (
    <div style={style} className="group/node relative flex h-full flex-col overflow-hidden">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 hidden size-4 group-hover/node:inline-flex"
        onClick={handleDelete}
      >
        <XIcon />
      </Button>
      <span>id: {id}</span>
      <span>type: {type}</span>
      <span>label: {data?.label}</span>
      {data?.showDragHandle && (
        <div className="flex gap-2">
          <Button variant="ghost" className="drag-handle__custom size-4" size="icon">
            <GripHorizontalIcon />
          </Button>
          <BadTooltip
            trigger={{
              children: <IconQuestion className="size-4" />,
            }}
            content={{children: t('lib.defaultDragWholeCard')}}
          />
        </div>
      )}
    </div>
  );
}
