import {Label} from '@badnpm/ui';

const dragId = 'drag-id';
export const dragMimeTYpe = 'application/my-drag-type';
export const dragIdMimeTYpe = `application/${dragId}`;

export default function DraggableElement() {
  return (
    <span
      tabIndex={-1}
      draggable={true}
      onDragStart={(event) => {
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData(dragMimeTYpe, JSON.stringify({type: 'drag-type', id: dragId}));
          event.dataTransfer.setData(dragIdMimeTYpe, dragId);
          event.dataTransfer.setData('text/plain', 'nothing');
        }
      }}
      className="cursor-grab rounded-md border p-2"
    >
      <Label className="cursor-grab">拖拽此元素到dock&nbsp;[dragId]</Label>
    </span>
  );
}
