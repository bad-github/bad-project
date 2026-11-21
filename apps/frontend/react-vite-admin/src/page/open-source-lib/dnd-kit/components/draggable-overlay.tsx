import {createPortal} from 'react-dom';
import {defaultDropAnimationSideEffects, DragOverlay} from '@dnd-kit/core';

/**
 * useDndContext建议只用在overlay中，因为它只是一个拖拽时的自定义渲染，不会有很复杂的逻辑。其他地方建议自己维护一个active
 *    (1)useDndContext().active 是整个应用中共享的状态，所有使用它的组件一旦有变化都会重新渲染。
 *    (2)可以控制渲染范围，提高性能
 *
 * 建议在拖拽时通过自定义overlay，而不是改变元素的transform
 */
export default function DraggableOverlay({
  children,
  adjustScale = true,
  zIndex,
}: {
  children?: React.ReactNode;
  adjustScale?: boolean;
  zIndex?: number;
}) {
  // active表示当前正在拖拽中的元素，，拖拽结束后会被自动置为 null。不管你有多少个 draggable，active 永远只指向当前正在被拖拽的那一个
  // const {active} = useDndContext();
  return createPortal(
    <DragOverlay
      zIndex={zIndex}
      adjustScale={adjustScale} // 拖拽时，DragOverlay 会根据目标容器的缩放比例动态调整大小。比如多列垂直拖拽时，当把一个item拖到一个空列时，这个item的尺寸就变成了空列的尺寸
      // 放手时，原位置的拖拽元素会带着一个渐变成半透明的动画效果。如果不配置放手时，原位置元素直接消失
      dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: {
            active: {
              opacity: '0.5',
            },
          },
        }),
      }}
    >
      {children ? children : <div className="w-[192px] h-[96px] bg-chart-2 rounded-md cursor-grabbing">overlay</div>}
    </DragOverlay>,
    document.body
  );
}
