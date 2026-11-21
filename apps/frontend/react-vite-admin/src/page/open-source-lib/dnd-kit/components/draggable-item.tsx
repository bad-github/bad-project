import {type Data, type UniqueIdentifier, useDraggable} from '@dnd-kit/core';
import {CSS} from '@dnd-kit/utilities';

import Draggable from './draggable';
import {useMemo} from 'react';

type TProps = {
  id: UniqueIdentifier;
  wrapper?: boolean;
  children?: React.ReactNode;
  data?: Data;
  style?: React.CSSProperties;
  endStyle?: React.CSSProperties;
  className?: string;
  enableOverlay?: boolean;
  handle?: boolean;
};

/**
 * 为什么要再抽一层组件
 * 若直接在某个页面中使用，当拖拽时（若通过transform改变位置），那页面会一直render
 */
export default function DraggableItem(props: TProps) {
  const {
    id,
    wrapper,
    data,
    style,
    endStyle,
    className,
    enableOverlay,
    handle,
    children = <div className="bg-primary h-[96px] w-[192px] rounded-md">Draggable Item</div>,
  } = props;
  const {transform, isDragging, attributes, listeners, setNodeRef} = useDraggable({id, data});

  const baseStyle = useMemo<React.CSSProperties>(
    () => ({position: 'relative', ...(isDragging ? {opacity: 0.6} : undefined), ...style}),
    [style, isDragging]
  );
  const moveStyle = useMemo<React.CSSProperties>(() => ({transform: CSS.Translate.toString(transform)}), [transform]);

  return (
    <Draggable
      wrapper={wrapper}
      style={enableOverlay ? {...baseStyle} : {...baseStyle, ...moveStyle}}
      endStyle={enableOverlay ? {} : endStyle}
      handle={handle}
      className={className}
      isDragging={isDragging}
      attributes={attributes}
      listeners={listeners}
      ref={setNodeRef}
      children={children}
    />
  );
}
