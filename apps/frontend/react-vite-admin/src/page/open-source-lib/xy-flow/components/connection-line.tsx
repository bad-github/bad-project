import {cn} from '@badnpm/ui';
import {useMemo} from 'react';
import {
  type ConnectionLineComponentProps,
  ConnectionLineType,
  getBezierPath,
  getSimpleBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useConnection,
} from '@xyflow/react';

export default function ConnectionLine(props: ConnectionLineComponentProps & {type?: ConnectionLineType}) {
  const {fromX, fromY, toX, toY, fromPosition, toPosition, connectionLineStyle, connectionStatus, type} = props;
  const {fromHandle} = useConnection();

  const pathParams = {
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
  };
  // 查看@xyflow/react源码，模仿ConnectionLine的实现，返回内部默认的连线
  const pathLine = useMemo(() => {
    let path;
    switch (type) {
      case ConnectionLineType.Bezier:
        [path] = getBezierPath(pathParams);
        break;
      case ConnectionLineType.SimpleBezier:
        [path] = getSimpleBezierPath(pathParams);
        break;
      case ConnectionLineType.Step:
        [path] = getSmoothStepPath({...pathParams, borderRadius: 0});
        break;
      case ConnectionLineType.SmoothStep:
        [path] = getSmoothStepPath(pathParams);
        break;
      default:
        [path] = getStraightPath(pathParams);
    }
    return path;
  }, [type, fromX, fromY, toX, toY, fromPosition, toPosition]);

  if (!fromHandle?.id) {
    return (
      <svg className="react-flow__connectionline react-flow__container">
        <g className={cn('react-flow__connection', connectionStatus)}>
          <path d={pathLine} fill="none" className="react-flow__connection-path" style={connectionLineStyle} />;
        </g>
      </svg>
    );
  }
  return (
    <g>
      <path
        fill="none"
        stroke={fromHandle.id}
        strokeWidth={1.5}
        className="animated" // 带动画
        d={`M${fromX},${fromY} C ${fromX} ${toY} ${fromX} ${toY} ${toX},${toY}`}
      />
      <circle cx={toX} cy={toY} fill="#fff" r={3} stroke={fromHandle.id} strokeWidth={1.5} />
    </g>
  );
}
