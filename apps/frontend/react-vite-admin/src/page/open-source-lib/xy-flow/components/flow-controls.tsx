import {ControlButton, Controls, useReactFlow, useStore, useStoreApi} from '@xyflow/react';
import {Lock, LockOpen, Maximize, Minus, Plus} from 'lucide-react';
import {shallow} from 'zustand/shallow';

type TProps = {
  children?: React.ReactNode;
};

export default function FlowControls({children}: TProps) {
  const {zoomIn, zoomOut, fitView} = useReactFlow();
  // copy 源码处理方式
  const isInteractive = useStore((s) => s.nodesDraggable || s.nodesConnectable || s.elementsSelectable, shallow);
  const store = useStoreApi();

  const onToggleInteractivity = () => {
    store.setState({
      nodesDraggable: !isInteractive,
      nodesConnectable: !isInteractive,
      elementsSelectable: !isInteractive,
    });
  };

  return (
    <Controls
      position="bottom-left"
      orientation="vertical"
      showFitView={false}
      showZoom={false}
      showInteractive={false}
    >
      <ControlButton onClick={() => zoomIn()}>
        <Plus />
      </ControlButton>
      <ControlButton onClick={() => zoomOut()}>
        <Minus />
      </ControlButton>
      <ControlButton onClick={() => fitView({maxZoom: 1, duration: 100})}>
        <Maximize />
      </ControlButton>
      <ControlButton onClick={() => onToggleInteractivity()}>
        {isInteractive ? <LockOpen className="fill-none!" /> : <Lock className="fill-none!" />}
      </ControlButton>
      {children}
    </Controls>
  );
}
