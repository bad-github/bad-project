import {forwardRef, memo, useMemo} from 'react';
import {useDraggable} from '@dnd-kit/core';
import {GripVerticalIcon} from 'lucide-react';

import {Button, cn} from '@badnpm/ui';

type DragRes = ReturnType<typeof useDraggable>;
type TDragProps = Partial<DragRes> & {
  wrapper?: boolean;
  handle?: boolean;
  children?: React.ReactNode;
  // 移动过程中transform的样式。设置了则在拖动中会实时更新位置
  style?: React.CSSProperties;
  // 拖拽后物体的坐标，决定拖动后是否会回到初始位置。设置了则不会回到初始位置
  endStyle?: React.CSSProperties;
  // 如果以上两者都没设置，则没有什么拖拽中的坐标变化。但此时可以使用DragOverlay自定义拖拽中的元素
  className?: string;
};
const Draggable = forwardRef<HTMLDivElement, TDragProps>(function Draggable(props, ref) {
  const {wrapper, handle, children, style, endStyle, className, isDragging, attributes, listeners} = props;

  const baseStyle: React.CSSProperties = {
    ...style,
    cursor: isDragging ? 'grabbing' : handle ? 'default' : 'grab',
  };

  const finalStyle: React.CSSProperties = {
    ...baseStyle,
    ...(wrapper ? {} : endStyle),
  };

  const draggingClass = useMemo(() => {
    return isDragging ? 'shadow-md [&_*]:cursor-grabbing' : '';
  }, [isDragging]);

  // 不能将DragOrigin定义为函数组件，因为不是直接的div setNodeRef。要保证useDraggable和对应的ref同步渲染
  const DragOrigin = (
    <div
      /**
       * tabIndex
       * 0：元素可聚焦，并按照DOM 顺序参与 Tab 键导航（最常用）
       * -1：元素可聚焦，但不能通过 Tab 键访问，只能用 JS（如 .focus()）聚焦
       * 1，2，3：元素可聚焦，并按你设置的数字顺序优先聚焦（不推荐）
       */
      {...attributes} // 其中属性tabIndex=0
      aria-label="Draggable"
      data-cypress="draggable-item"
      {...(handle ? {} : listeners)}
      tabIndex={handle ? -1 : undefined}
      ref={ref}
      // 为了直接使用children的尺寸，添加inline-flex
      className={cn('relative inline-flex', className, draggingClass)}
      style={finalStyle}
    >
      {children}
      {handle && (
        <Button
          style={{cursor: 'grab'}}
          className="absolute top-1/2 right-0 size-7 translate-y-[-50%]"
          variant="ghost"
          size="icon"
          data-cypress="draggable-handle"
          {...listeners}
        >
          <GripVerticalIcon />
        </Button>
      )}
    </div>
  );

  if (!wrapper) return DragOrigin;
  /**
   * 若拖动区域无限制：建议设置一个父容器，在拖动至外部区域产生横向滚动条，再拖动回来时效果会很好
   * 若有拖动区域限制，比如restrictToParentElement，可以不设置这个父容器
   */
  return (
    <div style={endStyle} className={cn('relative inline-flex border-1', className)}>
      {DragOrigin}
    </div>
  );
});

export default memo(Draggable);
