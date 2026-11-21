import {memo} from 'react';
import {Handle, NodeToolbar, Position, type Node, type NodeProps} from '@xyflow/react';
import './index.css';
import {NodeType} from '../../types';

// 每一个节点中的data属性
type TData = {
  label?: string;
  childrenRender?: React.ReactNode | ((props?: any) => React.ReactNode);
  toolbar?: boolean;
};
// 同时指定data和type的类型
export type TCommonNode = Node<TData, typeof NodeType.commonNode>;

const CommonNode = (props: NodeProps<TCommonNode>) => {
  const {
    data: {label, childrenRender, toolbar},
    isConnectable, // node中的connectable配置
    sourcePosition,
    targetPosition,
  } = props;
  return (
    <>
      {toolbar && (
        <NodeToolbar isVisible position={Position.Top} align="start">
          <div className="flex gap-2 text-xs [&>*]:border [&>*]:px-1 [&>*]:py-0.5 [&>*]:rounded [&>*]:cursor-pointer">
            <span>cut</span>
            <span>copy</span>
            <span>paste</span>
          </div>
        </NodeToolbar>
      )}
      <Handle
        type="target"
        // 若设置成false：表示我不能连接其他点，但其他点可以连接我
        // isValidConnection={() => false}
        isValidConnection={(connection) => {
          // 不允许连自己，只有target到source才会触发这个函数。所以source到target仍然可以连接，可以配置ReactFlow的isValidConnection来避免
          console.log(connection, 'isValidConnection');
          return connection.source !== connection.target;
        }}
        // isValidConnection={() => false}
        position={targetPosition || Position.Left}
        // 从此点出发连接其他点会触发
        onConnect={(params) => console.log('handle onConnect', params)}
        isConnectable={isConnectable}
      />
      {childrenRender ? typeof childrenRender === 'function' ? childrenRender() : childrenRender : <div>{label}</div>}
      <Handle type="source" position={sourcePosition || Position.Right} isConnectable={isConnectable} />
    </>
  );
};

export default memo(CommonNode);
