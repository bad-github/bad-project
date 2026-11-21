import type {IDockviewHeaderActionsProps} from 'dockview';
import {Plus} from 'lucide-react';
import {addPanel, iconClass} from '../tool';
import {PanelType} from '../types';

export default function LeftHeader(props: IDockviewHeaderActionsProps) {
  const handleAdd = () => {
    // 一个group中可能有不同类型的panel，所以无法确定当前group的panel type
    addPanel(props.containerApi, {component: PanelType.common, position: {referenceGroup: props.group}});
  };
  return (
    <div className="h-full flex items-center pl-1">
      <span className={iconClass} onClick={handleAdd}>
        <Plus className="size-4" />
      </span>
    </div>
  );
}
