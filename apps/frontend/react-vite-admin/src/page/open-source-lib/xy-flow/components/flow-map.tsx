import {MiniMap} from '@xyflow/react';
import {NodeType} from '../types';

export default function FlowMap() {
  const nodeColorMap: Record<string, string> = {
    [NodeType.input]: 'var(--color-destructive)',
    [NodeType.commonNode]: 'var(--color-primary)',
    [NodeType.resizableNode]: 'var(--color-primary)',
    [NodeType.output]: 'var(--color-destructive)',
  };

  // <MiniMap<CommonNodeType>
  return (
    <MiniMap
      pannable
      zoomable
      inversePan
      position="bottom-right"
      nodeColor={(n) => {
        return n.type ? nodeColorMap[n.type] || 'var(--color-accent)' : 'var(--color-accent)';
      }}
    />
  );
}
