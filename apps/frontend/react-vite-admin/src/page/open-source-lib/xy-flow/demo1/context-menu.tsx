import {toast, ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger} from '@badnpm/ui';
import {useEffect, useRef} from 'react';

export default function Menu(props: any) {
  const {style, event, data} = props;
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!event) return;
    const onContextMenu = () => {
      const mouseEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        clientX: event.clientX,
        clientY: event.clientY,
      });
      requestAnimationFrame(() => {
        triggerRef.current?.dispatchEvent(mouseEvent);
      });
    };
    onContextMenu();
  }, [event]);

  return (
    // 加key的目的是为了防止下次右键时，弹出的菜单还是在上次的位置
    <ContextMenu key={event?.clientX + '-' + event?.clientY}>
      <ContextMenuTrigger ref={triggerRef} className="hidden overflow-hidden border" style={style}>
        Right click here
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => {
            toast.add({title: `${data.id}, click item1`, type: 'info'});
          }}
        >
          item1
        </ContextMenuItem>
        <ContextMenuItem>item2</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
