import {memo} from 'react';
import {Handle, Position, useStore, type Node, type NodeProps} from '@xyflow/react';
import './index.css';
import {NodeType} from '../../types';

// 每一个节点中的data属性
type TData = {
  label?: string;
  childrenRender?: React.ReactNode | ((props?: any) => React.ReactNode);
};
export type TPlaceholderNode = Node<TData, typeof NodeType.placeholderNode>;

const PlaceholderNode = (props: NodeProps<TPlaceholderNode>) => {
  // s.transform=[translateX, translateY, zoom]
  const showContent = useStore((s) => s.transform[2] > 0.5);
  const {
    data: {label, childrenRender},
    isConnectable, // node中的connectable配置
    sourcePosition,
    targetPosition,
  } = props;
  return (
    <>
      <Handle type="target" position={targetPosition || Position.Left} isConnectable={isConnectable} />
      {showContent ? (
        <>
          {childrenRender ? (
            typeof childrenRender === 'function' ? (
              childrenRender()
            ) : (
              childrenRender
            )
          ) : (
            <div>{label}</div>
          )}
        </>
      ) : (
        <div className="h-full flex flex-col gap-2 p-4">
          <div className="bg-muted h-4"></div>
          <div className="bg-muted h-4"></div>
        </div>
      )}

      <Handle type="source" position={sourcePosition || Position.Right} isConnectable={isConnectable} />
    </>
  );
};

export default memo(PlaceholderNode);
