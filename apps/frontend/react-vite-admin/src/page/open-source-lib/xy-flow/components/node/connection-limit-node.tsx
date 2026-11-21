import {memo} from 'react';
import {Handle, Position, useNodeConnections, type Node, type NodeProps} from '@xyflow/react';
import './index.css';
import {NodeType} from '../../types';

// 每一个节点中的data属性
type TData = {
  label?: string;
  childrenRender?: React.ReactNode | ((props?: any) => React.ReactNode);
  connectionCount?: number;
};
// 同时指定data和type的类型
export type TConnectionLimitNode = Node<TData, typeof NodeType.connectionLimitNode>;

const ConnectionLimitNode = (props: NodeProps<TConnectionLimitNode>) => {
  const {
    data: {label, childrenRender, connectionCount},
    isConnectable, // node中的connectable配置
    sourcePosition,
    targetPosition,
  } = props;
  console.log(connectionCount, '===');
  const targets = useNodeConnections({handleType: 'target'});
  const sources = useNodeConnections({handleType: 'source'});

  const targetIsConnectable = isConnectable && (connectionCount ? targets.length < connectionCount : true);
  const sourceIsConnectable = isConnectable && (connectionCount ? sources.length < connectionCount : true);

  return (
    <>
      <Handle type="target" position={targetPosition || Position.Left} isConnectable={targetIsConnectable} />
      {childrenRender ? typeof childrenRender === 'function' ? childrenRender() : childrenRender : <div>{label}</div>}
      <Handle type="source" position={sourcePosition || Position.Right} isConnectable={sourceIsConnectable} />
    </>
  );
};

export default memo(ConnectionLimitNode);
