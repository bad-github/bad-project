import {memo, useEffect} from 'react';
import {BaseEdge, getSimpleBezierPath, useInternalNode} from '@xyflow/react';
import type {Edge, EdgeProps} from '@xyflow/react';
import {useShallow} from 'zustand/shallow';
import useFlowStore from '@/store/flow-store';
import {getEdgeParams} from './tool';
import {EdgeType} from '../../types';
// 第一个泛型表示data的类型
export type TFloatingEdge = Edge<{parentNetwork: string}, typeof EdgeType.floatingEdge>;

const FloatingEdge = (props: EdgeProps<TFloatingEdge>) => {
  const {id, source, target, markerEnd, style} = props;
  const {setEdgePath, removeEdgePath} = useFlowStore(
    useShallow((s) => ({setEdgePath: s.setEdgePath, removeEdgePath: s.removeEdgePath}))
  );
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  const {sx, sy, tx, ty} = getEdgeParams(sourceNode, targetNode);

  const [path] = getSimpleBezierPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
  });

  const [reversePath] = getSimpleBezierPath({
    sourceX: tx,
    sourceY: ty,
    targetX: sx,
    targetY: sy,
  });

  useEffect(() => {
    setEdgePath(id, {opposite: path, reverse: reversePath});
    return () => {
      removeEdgePath(id);
    };
  }, [id, path]);

  if (!sourceNode || !targetNode) {
    return null;
  }

  return (
    <>
      <BaseEdge id={id} className="react-flow__edge-path" path={path} markerEnd={markerEnd} style={style} />
    </>
  );
};

export default memo(FloatingEdge);
