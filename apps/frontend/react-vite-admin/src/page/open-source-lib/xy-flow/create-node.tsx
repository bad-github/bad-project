import type {Node} from '@xyflow/react';
import NodeCard from './components/node/node-card';
import {NodeType} from './types';
import {customNodeProps} from './components/tool';

// 返回值的组织结构尽量和react-flow的Node报保持一致
export const buildNode = (node: Node, Component?: React.ComponentType<any>): Node => {
  const props = {...customNodeProps};

  const childrenRender = Component
    ? (props: any) => <Component {...node} {...props} />
    : (props: any) => <NodeCard {...node} {...props} />;

  const {type, data} = node;
  if ([NodeType.commonNode, NodeType.multipleSourceNode, NodeType.placeholderNode].includes(type as any)) {
    return {
      ...props,
      ...node,
      data: {
        ...data,
        childrenRender,
      },
    };
  } else if (type === NodeType.resizableNode) {
    return {
      ...props,
      ...node,
      data: {
        ...data,
        // resize: 'selected',
        // 想要设置缩放节点的最小宽高，必须设置react-flow__node-resizable-node的样式
        childrenRender,
      },
    };
  }
  return {...node};
};
