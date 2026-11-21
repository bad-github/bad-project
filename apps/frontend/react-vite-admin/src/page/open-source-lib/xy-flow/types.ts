import type {BuiltInEdge, BuiltInNode} from '@xyflow/react';
import type {TResizableNode} from './components/node/resizable-node';
import type {TCommonNode} from './components/node/common-node';
import type {TCommonEdge} from './components/edge/common-edge';

export type NodeUnion = BuiltInNode | TCommonNode | TResizableNode; // 可替代原有Node类型
export type EdgeUnion = BuiltInEdge | TCommonEdge; // 可替代原有Edge类型

export const NodeType = {
  // 内置
  default: 'default',
  input: 'input',
  output: 'output',
  group: 'group',
  // 自定义
  commonNode: 'common-node',
  resizableNode: 'resizable-node',
  multipleSourceNode: 'multiple-source-node',
  connectionLimitNode: 'connection-limit-node',
  placeholderNode: 'placeholder-node'
} as const;
export type TNodeType = (typeof NodeType)[keyof typeof NodeType];

export const EdgeType = {
  // 内置
  default: 'default',
  straight: 'straight',
  smoothstep: 'smoothstep',
  simplebezier: 'simplebezier',
  step: 'step',
  // 自定义
  commonEdge: 'common-edge',
  floatingEdge: 'floating-edge',
  animatedEdge: 'animated-edge',
} as const;
export type TEdgeType = (typeof EdgeType)[keyof typeof EdgeType];
