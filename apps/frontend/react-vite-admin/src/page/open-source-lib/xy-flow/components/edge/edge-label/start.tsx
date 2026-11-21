import type {ReactNode} from 'react';
import {EdgeLabelRenderer} from '@xyflow/react';

type TProps = {
  label: ReactNode;
  sourceX: number;
  sourceY: number;
};

export default function Start({label, sourceX, sourceY}: TProps) {
  return (
    <EdgeLabelRenderer>
      <div
        className="react-flow__edge-text nodrag nopan"
        style={{
          position: 'absolute',
          transform: `translate(-50%, 0%) translate(${sourceX}px, ${sourceY}px)`,
        }}
      >
        start {label}
      </div>
    </EdgeLabelRenderer>
  );
}
