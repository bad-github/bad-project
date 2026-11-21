import React, {useEffect, useMemo} from 'react';
import {CSS} from '@dnd-kit/utilities';
import {type AnimateLayoutChanges, defaultAnimateLayoutChanges, useSortable} from '@dnd-kit/sortable';
import type {Data, UniqueIdentifier} from '@dnd-kit/core';
import type {Disabled} from '@dnd-kit/sortable/dist/types';
import {GripVerticalIcon, XIcon, PencilIcon} from 'lucide-react';

import {Button, cn} from '@badnpm/ui';

type TProps = {
  id: UniqueIdentifier;
  index?: number;
  disabled?: boolean | Disabled;
  data?: Data;
  style?: React.CSSProperties;
  enableOverlay?: boolean;
  handle?: boolean;
  handleProps?: Record<string, any>;
  action?: boolean;
  actionProps?: Record<string, any>;
  handleAction?: (e: React.MouseEvent<HTMLButtonElement>, type: 'edit' | 'delete', data: Record<string, any>) => void;
  className?: string;
  children?:
    React.ReactNode | ((props: Pick<ReturnType<typeof useSortable>, 'listeners' | 'isDragging'>) => React.ReactNode);
  animateLayoutChanges?: AnimateLayoutChanges;
};

const Action = (props: Pick<TProps, 'handleAction' | 'actionProps' | 'data'>) => {
  const {handleAction, actionProps, data} = props;

  return (
    <div className={cn('absolute top-0 right-4 flex gap-2', actionProps?.className)}>
      <Button
        size="icon"
        variant="ghost"
        className="size-7"
        // 在整个拖拽元素上使自定义事件生效，而不需要设置拖拽锚
        onMouseDown={(e) => e.stopPropagation()}
        // onPointerDown={e => e.stopPropagation()}
        onClick={(e) => handleAction?.(e, 'edit', data as any)}
      >
        <PencilIcon />
      </Button>
      <Button size="icon" variant="ghost" className="size-7" onClick={(e) => handleAction?.(e, 'delete', data as any)}>
        <XIcon />
      </Button>
    </div>
  );
};

export default function SortableItem(props: TProps) {
  const {
    index,
    id,
    data,
    style,
    className,
    enableOverlay,
    disabled,
    handle,
    handleProps,
    action,
    actionProps,
    handleAction,
    animateLayoutChanges = (args) => defaultAnimateLayoutChanges({...args, wasDragging: true}),
    children = <div>{index}</div>,
  } = props;
  // 当在SortContext中设置了overlay时，垂直的useSortable返回的transform.x始终为0
  const {attributes, listeners, isDragging, transform, transition, setNodeRef, setActivatorNodeRef} = useSortable({
    id,
    disabled,
    data,
    animateLayoutChanges,
  });

  const disabledAttr = useMemo(() => {
    if (typeof disabled === 'boolean') {
      return disabled;
    } else if (typeof disabled === 'object') {
      return Object.values(disabled).every((v) => v);
    }
    return false;
  }, [disabled]);

  const finalStyle: React.CSSProperties = {
    // 必须设置relative，否则在垂直列表往下拖动会有遮挡的情况
    position: 'relative',
    touchAction: handle ? 'none' : 'manipulation', // 允许单指拖动（滚动）和点击。禁止双指缩放（pinch zoom）和双击放大（double-tap zoom）
    transition: transition ? transition : '',
    transform: CSS.Translate.toString(transform),
    opacity: disabledAttr ? 0.3 : isDragging && enableOverlay ? 0.5 : 1,
    ...(isDragging
      ? {zIndex: 99, cursor: 'grabbing'}
      : {cursor: disabledAttr ? 'not-allowed' : handle ? 'default' : 'grab'}),
    ...style,
  };

  useEffect(() => {
    if (!enableOverlay || !isDragging) {
      return;
    }
    document.body.style.cursor = 'grabbing';
    return () => {
      document.body.style.cursor = '';
    };
  }, [enableOverlay, isDragging]);

  return (
    <div
      className={className}
      data-cypress="draggable-item"
      data-index={index}
      data-id={data?.id}
      ref={setNodeRef}
      style={finalStyle}
      {...attributes}
      {...(handle ? {} : listeners)}
      tabIndex={handle ? -1 : undefined}
    >
      {/* 渲染回调只接收事件和状态，手柄 ref 直接交给下方按钮。 */}
      {typeof children === 'function' ? children({listeners, isDragging}) : children}
      {handle && (
        <Button
          style={{cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'manipulation', ...handleProps?.style}}
          className={cn('absolute top-1/2 right-0 size-7 translate-y-[-50%]', handleProps?.className)}
          variant="ghost"
          size="icon"
          data-cypress="draggable-handle"
          ref={setActivatorNodeRef}
          {...listeners}
        >
          <GripVerticalIcon />
        </Button>
      )}
      {action && <Action data={data} handleAction={handleAction} actionProps={actionProps} />}
    </div>
  );
}
