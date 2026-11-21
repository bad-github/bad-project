import type {ReactNode} from 'react';
import {EdgeLabelRenderer} from '@xyflow/react';

type TProps = {
  label: ReactNode;
  targetX: number;
  targetY: number;
};

export default function End({label, targetX, targetY}: TProps) {
  return (
    <EdgeLabelRenderer>
      <div
        className="react-flow__edge-text nodrag nopan"
        style={{
          position: 'absolute',
          transform: `translate(-50%, -100%) translate(${targetX}px, ${targetY}px)`,
        }}
      >
        end {label}
      </div>
    </EdgeLabelRenderer>
  );
}
