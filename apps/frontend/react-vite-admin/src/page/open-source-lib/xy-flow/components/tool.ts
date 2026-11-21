import {
  ConnectionLineType,
  ConnectionMode,
  MarkerType,
  type DefaultEdgeOptions,
  type FitViewOptions,
  type ReactFlowProps,
  type Viewport,
} from '@xyflow/react';

export const customNodeProps = {
  width: 160,
  height: 80,
};

// 自动缩放的行为
export const fitViewOptions: FitViewOptions = {
  // 画布边缘留白比例
  padding: 0.1,
  // 缩放最小值
  minZoom: 1,
  // 缩放最大值，不会控制是否居中
  maxZoom: 1,
  // 缩放动画时长
  duration: 200,
  // 是否把隐藏的节点（hidden: true 的节点）也算入 fitView 的范围。
  includeHiddenNodes: false,
  // 只对指定节点运用fitView
  // nodes: [{id: 'n1'}, {id: 'n2'}]
};

export const defaultEdgeOptions: DefaultEdgeOptions = {
  animated: false,
  label: 'label',
  // 边终点的箭头或标记类型
  markerEnd: {type: MarkerType.ArrowClosed, width: 32, height: 32},
  // 是否允许删除，对用户手动添加的连线生效
  deletable: true,
  selectable: true,
  data: {key1: 'value1'},
};

// 初始化画布时的默认视口位置和缩放，fitView会调整视口以适应所有节点，可能会覆盖此设置
export const defaultViewport: Viewport = {
  x: 0,
  y: 0,
  zoom: 1.0,
};

export const defaultFlowProps: ReactFlowProps = {
  // 选中节点时提升节点的层级
  elevateNodesOnSelect: true,
  // 选中连线时提升连线的层级
  elevateEdgesOnSelect: true,
  /**
   * strict：连接只能从source开始，并结束在target
   * loose：任何类型的连接点之间都可以建立连接，但是会在onConnect的addEdge时内部进行校验，最终也只能是source和target之间形成线段
   */
  connectionMode: ConnectionMode.Strict,
  // 去掉水印
  proOptions: {hideAttribution: true},
  // 水印位置
  attributionPosition: 'bottom-right',
  // 设置为null禁用默认的删除行为
  deleteKeyCode: ['Backspace', 'Delete'],
  // 可以尽可能的放大或缩小
  minZoom: 0.05,
  maxZoom: 10,
  defaultEdgeOptions: defaultEdgeOptions,
  defaultViewport: defaultViewport,
  // 连线样式
  connectionLineType: ConnectionLineType.Bezier,
  // 不允许自连接
  isValidConnection: (connection) => connection.source !== connection.target,
};
