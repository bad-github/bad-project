import type {CSSProperties} from 'react';
import {useSortable} from '@dnd-kit/sortable';
import {type Cell, flexRender} from '@tanstack/react-table';
import {CSS} from '@dnd-kit/utilities';
import classes from './index.module.less';

export default function DragAlongCell({cell}: {cell: Cell<any, unknown>}) {
  const {isDragging, setNodeRef, transform} = useSortable({
    id: cell.column.id,
  });
  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
    transform: CSS.Translate.toString(transform), // translate instead of transform to avoid squishing
    transition: 'width transform 0.2s ease-in-out',
    width: cell.column.getSize(),
    zIndex: isDragging ? 1 : 0,
  };
  return (
    <div
      className={classes.td}
      style={{...style, width: `calc(var(--col-${cell.column.id}-size) * 1px)`}}
      ref={setNodeRef}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </div>
  );
}
