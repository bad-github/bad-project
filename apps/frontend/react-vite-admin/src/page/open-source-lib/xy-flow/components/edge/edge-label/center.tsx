import {toast} from '@badnpm/ui';
import type {ReactNode} from 'react';
import {EdgeLabelRenderer} from '@xyflow/react';

type TProps = {
  label: ReactNode;
  labelX: number;
  labelY: number;
};

export default function Center({label, labelX, labelY}: TProps) {
  return (
    <EdgeLabelRenderer>
      <span
        className="react-flow__edge-text edge-label-renderer__custom-edge nodrag nopan"
        style={{
          position: 'absolute',
          pointerEvents: 'all', // 确保可交互
          transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
        }}
        onClick={() => {
          toast.add({title: '点击自定义edge', type: 'info'});
        }}
      >
        custom {label}
      </span>
    </EdgeLabelRenderer>
  );
}
