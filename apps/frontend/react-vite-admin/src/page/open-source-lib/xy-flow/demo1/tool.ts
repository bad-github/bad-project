import {MarkerType, Position, type Edge, type Node} from '@xyflow/react';
import {EdgeType, NodeType} from '../types';
import {buildNode} from '../create-node';
import {i18n} from '@/i18n';
import {customNodeProps} from '../components/tool';

export const initialNodes: Node[] = [
  {
    id: 'n1',
    position: {x: 0, y: 0}, // 区域左上角，fitView会自动缩放到合适位置
    data: {label: 'Node 1, ' + i18n.t('lib.notDeletable')},
    sourcePosition: Position.Right,
    deletable: false,
    type: 'input',
  },
  {
    id: 'n2',
    position: {x: 300, y: 0},
    type: NodeType.default,
    data: {label: 'Node 2, ' + i18n.t('lib.notSelectable')},
    selectable: false,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: 'n3',
    position: {x: 600, y: 0},
    type: NodeType.default,
    data: {label: 'Node 3, ' + i18n.t('lib.notDraggable')},
    draggable: false,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: 'n4',
    position: {x: 600, y: 150},
    data: {label: 'Node 4, ' + i18n.t('lib.commonNode') + ', ' + i18n.t('lib.notConnectable')},
    type: NodeType.commonNode,
    connectable: false,
    sourcePosition: Position.Left,
    targetPosition: Position.Right,
    ...customNodeProps,
  },
  {
    id: 'n5',
    position: {x: 300, y: 150},
    data: {label: 'Node 5, ' + i18n.t('lib.commonNode') + ', ' + i18n.t('lib.notTabFocus')},
    // 配置的属性默认生效：React Flow 核心渲染器先处理这些属性，决定要不要给节点绑定拖拽/焦点/删除/连线等事件
    focusable: false,
    type: NodeType.commonNode,
    sourcePosition: Position.Left,
    targetPosition: Position.Right,
    ...customNodeProps,
  },
  {
    id: 'n6',
    position: {x: 0, y: 150},
    data: {label: 'Node 6, ' + i18n.t('lib.commonNode')},
    type: NodeType.commonNode,
    sourcePosition: Position.Left,
    targetPosition: Position.Right,
    ...customNodeProps,
  },
  {
    ...buildNode({
      type: NodeType.commonNode,
      id: 'n7',
      position: {x: 0, y: 300},
      data: {
        label: i18n.t('lib.withDragHandle'),
        showDragHandle: true,
      },
    }),
    style: {
      backgroundColor: '#FF0072',
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    dragHandle: '.drag-handle__custom',
    ...customNodeProps,
  },
  {
    ...buildNode({
      type: NodeType.commonNode,
      id: 'n8',
      position: {x: 300, y: 300},
      data: {
        label: i18n.t('lib.withToolbar'),
        toolbar: true,
      },
    }),
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    ...customNodeProps,
  },
  {
    ...buildNode({
      type: NodeType.multipleSourceNode,
      id: 'n9',
      position: {x: 600, y: 300},
      data: {
        label: i18n.t('lib.multipleSourceNode'),
      },
    }),
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    ...customNodeProps,
  },
];

export const initialEdges: Edge[] = [
  // 边的连接方向并不是由拖拽手势决定的，而是由source和target决定
  {
    id: 'n1-n2',
    source: 'n1', // 连线的起点
    target: 'n2', // 连线的终点，箭头位置。默认只有target和source的连线才会生效。使用connectionMode="loose"（允许任意 handle 相连）
    type: EdgeType.default,
    animated: true, // 带动画
    reconnectable: 'source', // 线的起点可以拖动
  },
  {
    id: 'n2-n3',
    source: 'n2',
    target: 'n3',
    type: EdgeType.default,
    style: {
      strokeWidth: 2,
      stroke: '#FF0072',
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 32,
      height: 32,
      color: '#FF0072',
    },
    reconnectable: 'target',
  },
  {
    id: 'n5-n6',
    source: 'n5',
    target: 'n6',
    type: EdgeType.commonEdge,
  },
  {
    id: 'n7-n8',
    source: 'n7',
    target: 'n8',
    type: EdgeType.commonEdge,
    data: {
      pathType: 'smoothstep',
    },
  },
];

export function insertAndUpdateNode(nodes: Node[], source: string, distanceX: number, newNode: Node) {
  const result = [...nodes];
  const index = result.findIndex((node) => node.id === source);
  if (index === -1) return nodes;
  // 插入节点
  result.splice(index + 1, 0, newNode);
  // 更改后面节点的位置
  return result.map((v, indey) => {
    if (indey > index + 1) {
      return {
        ...v,
        position: {
          ...v.position,
          x: v.position.x + distanceX,
        },
      };
    }
    return v;
  });
}

let nextId = 99;
export function getNextId() {
  return nextId++;
}

// 可以用useNodesState代替以下state
// const [nodes, setNodes] = useState(initialNodes);
// const [edges, setEdges] = useState(initialEdges);
// const onNodesChange: OnNodesChange = useCallback(changes => {
//   console.log('onNodesChange', changes);
//   setNodes(nodesSnapshot => applyNodeChanges(changes, nodesSnapshot));
// }, []);
// const onEdgesChange: OnEdgesChange = useCallback(changes => {
//   console.log('onEdgesChange', changes);
//   setEdges(edgesSnapshot => applyEdgeChanges(changes, edgesSnapshot));
// }, []);
