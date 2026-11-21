import {toast, Label} from '@badnpm/ui';

export const dropMimeType = `application/my-drop-type`;

export default function DroppableElement() {
  const handleOnDrop = (e: React.DragEvent<HTMLSpanElement>) => {
    const mineType = e.dataTransfer.types.find((type) => type === dropMimeType);
    if (mineType) {
      const origin = e.dataTransfer.getData(dropMimeType);
      const data = JSON.parse(origin || '{}');
      toast.add({
        title: (
          <>
            type: {data.type},&nbsp;&nbsp;id: {data.id}
          </>
        ),
        type: 'info',
      });
    }
  };

  return (
    <span
      tabIndex={-1}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={handleOnDrop}
      className="cursor-grab rounded-md border p-2"
    >
      <Label className="cursor-grab">拖拽dock放置到此</Label>
    </span>
  );
}
