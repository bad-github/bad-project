import {memo} from 'react';
import {Handle, Position, type Node, type NodeProps} from '@xyflow/react';
import './index.css';
import {NodeType} from '../../types';

type TData = {
  label?: string;
  childrenRender?: React.ReactNode | ((props?: any) => React.ReactNode);
  toolbar?: boolean;
};
// 同时指定data和type的类型
export type TMultipleSourceNode = Node<TData, typeof NodeType.multipleSourceNode>;

const DEFAULT_HANDLE_STYLE = {
  width: 20,
  height: 20,
  bottom: -10,
};
// 每一个节点中的data属性
const MultipleSourceNode = (props: NodeProps<TMultipleSourceNode>) => {
  const {
    data: {label, childrenRender},
    isConnectable, // node中的connectable配置
    sourcePosition,
    targetPosition,
  } = props;
  
  return (
    <>
      <Handle type="target" position={targetPosition || Position.Top} isConnectable={isConnectable} />
      {childrenRender ? typeof childrenRender === 'function' ? childrenRender() : childrenRender : <div>{label}</div>}
      <Handle
        type="source"
        // 只要在同一个节点上放了多个 source 或多个 target handle，就必须为每个 handle 指定不同的 id。否则 React Flow 无法知道用户连接的是哪个 handle。
        id="red"
        position={sourcePosition || Position.Bottom}
        isConnectable={isConnectable}
        style={{...DEFAULT_HANDLE_STYLE, left: '15%', backgroundColor: 'red'}}
      />
      <Handle
        type="source"
        id="yellow"
        position={sourcePosition || Position.Bottom}
        isConnectable={isConnectable}
        style={{...DEFAULT_HANDLE_STYLE, left: '50%', backgroundColor: 'yellow'}}
      />
      <Handle
        type="source"
        id="blue"
        position={sourcePosition || Position.Bottom}
        isConnectable={isConnectable}
        style={{...DEFAULT_HANDLE_STYLE, left: '85%', backgroundColor: 'blue'}}
      />
    </>
  );
};

export default memo(MultipleSourceNode);
export const MultipleSourceNodeType = {
  [NodeType.multipleSourceNode]: MultipleSourceNode,
};
