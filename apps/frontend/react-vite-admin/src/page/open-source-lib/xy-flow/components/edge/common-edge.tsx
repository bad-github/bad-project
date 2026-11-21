import {memo, useMemo} from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSimpleBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useReactFlow,
} from '@xyflow/react';
import type {Edge, EdgeProps} from '@xyflow/react';
import {PlusCircleIcon} from 'lucide-react';
import {getNextId, insertAndUpdateNode} from '../../demo1/tool';
import {EdgeType, NodeType} from '../../types';
import {buildNode} from '../../create-node';
import Center from './edge-label/center';
import Start from './edge-label/start';
import End from './edge-label/end';
import {browser} from '@workspace/utils';
import {Button} from '@badnpm/ui';
import {customNodeProps} from '../tool';

// 第一个泛型表示data的类型
export type TCommonEdge = Edge<{key1: string; pathType: string}, typeof EdgeType.commonEdge>;

const CommonEdge = (props: EdgeProps<TCommonEdge>) => {
  const {addEdges, deleteElements, setNodes} = useReactFlow();
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    source,
    target,
    sourcePosition,
    targetPosition,
    label,
    data: {pathType} = {},
    ...restProps
  } = props;
  const safeProps = browser.getSafeProps(restProps, {excludeKeys: ['sourcePosition', 'targetPosition', 'selected']});

  const getPath = () => {
    const params = {sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition};
    switch (pathType) {
      case 'default':
        return getSimpleBezierPath(params);
      case 'straight':
        return getStraightPath(params);
      case 'step':
        // 渲染成直角折线
        return getSmoothStepPath({...params, borderRadius: 0});
      case 'smoothstep':
        return getSmoothStepPath(params);
      case 'simplebezier':
        // curvature: 曲率
        return getBezierPath({...params, curvature: 0.25});
      default:
        return getSimpleBezierPath(params);
    }
  };
  const getForwardPath = () => {
    const params = {
      sourceX: targetX,
      sourceY: targetY,
      targetX: sourceX,
      targetY: sourceY,
      sourcePosition: targetPosition,
      targetPosition: sourcePosition,
    };
    switch (pathType) {
      case 'default':
        return getSimpleBezierPath(params);
      case 'straight':
        return getStraightPath(params);
      case 'step':
        return getSmoothStepPath({...params, borderRadius: 0});
      case 'smoothstep':
        return getSmoothStepPath(params);
      case 'simplebezier':
        return getBezierPath(params);
      default:
        return getSimpleBezierPath(params);
    }
  };

  // 用getSimpleBezierPath设置type="default"的路径
  const [edgePath, labelX, labelY] = getPath();
  // 设置小球反方向运动的路径
  const [forwardEdgePath] = getForwardPath();

  const path = useMemo(() => {
    if (source !== target) return edgePath;
    // 自连接时的曲线
    const radiusX = (sourceX - targetX) * 0.6;
    const radiusY = 50;
    return `M ${sourceX - 5} ${sourceY} A ${radiusX} ${radiusY} 0 1 0 ${targetX + 2} ${targetY}`;
  }, [source, target, sourceX, sourceY, targetX, targetY, edgePath]);

  const handleInsertNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newNodeId = `n${getNextId()}`;
    // (1)删除原有连线
    deleteElements({edges: [{id}]});
    // (2)插入节点并更新后面所有节点的位置，addNodes默认添加到末尾
    setNodes((nodes) => {
      return insertAndUpdateNode(
        nodes,
        source,
        (customNodeProps.width * 3) / 2,
        buildNode({
          data: {},
          type: NodeType.commonNode,
          id: newNodeId,
          position: {
            x: sourceX + customNodeProps.width / 2,
            y: sourceY - customNodeProps.height / 2,
          },
        })
      );
    });
    // (3)对插入的节点分别进行连线
    addEdges([
      {
        id: `e-${source}-${newNodeId}`,
        type: EdgeType.commonEdge,
        source,
        target: newNodeId,
      },
      {
        id: `e-${newNodeId}-${target}`,
        type: EdgeType.commonEdge,
        source: newNodeId,
        target,
      },
    ]);
  };
  return (
    <>
      {/* 与内置的edge一样 */}
      <style>
        {`
          @keyframes my-dashdraw {
            to {
              stroke-dashoffset: 10;
            }
          }
        `}
      </style>
      <BaseEdge
        style={{strokeDasharray: 5, animation: 'my-dashdraw 0.5s linear infinite'}}
        id={id}
        path={path}
        {...safeProps}
      />
      <circle r="10" fill="#ff0073">
        <animateMotion dur="1s" repeatCount="indefinite" path={forwardEdgePath} />
      </circle>
      <EdgeLabelRenderer>
        <Button
          size="icon"
          variant="ghost"
          className="size-6"
          style={{
            position: 'absolute',
            zIndex: 1001, // 保证label和按钮重叠时，会触发按钮事件。且大于node的z-index
            pointerEvents: 'all',
            // 曲线时可能不是严格在线上
            transform: `translate(-50%, -50%) translate(${sourceX + (sourceX < targetX ? 12 : -12)}px, ${sourceY}px)`,
            transition: 'transform 10ms ease-in-out',
          }}
          onClick={handleInsertNode}
        >
          <PlusCircleIcon />
        </Button>
      </EdgeLabelRenderer>
      <Center labelX={labelX} labelY={labelY} label={label} />
      <Start label={label} sourceX={sourceX} sourceY={sourceY} />
      <End label={label} targetX={targetX} targetY={targetY} />
    </>
  );
};

export default memo(CommonEdge);
