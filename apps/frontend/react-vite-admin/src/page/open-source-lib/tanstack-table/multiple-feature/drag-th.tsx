import {cn} from '@badnpm/ui';
import type {CSSProperties} from 'react';
import {flexRender, type Header} from '@tanstack/react-table';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {ChevronDown, ChevronUp} from 'lucide-react';
import classes from './index.module.less';

export default function DragTh({header}: {header: Header<any, unknown>}) {
  const {attributes, isDragging, listeners, setNodeRef, transform} = useSortable({
    id: header.column.id,
  });

  const canSort = header.column.getCanSort();
  const sortHandler = (e: React.MouseEvent) => {
    const handler = header.column.getToggleSortingHandler();
    handler?.(e);
  };
  const sortDir = header.column.getIsSorted();

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
    transform: CSS.Translate.toString(transform), // translate instead of transform to avoid squishing
    // 必须指定宽度，因为表体也要跟着移动，否则会错位
    transition: 'width transform 0.2s ease',
    whiteSpace: 'nowrap',
    zIndex: isDragging ? 9 : 0,
  };

  const getSortTitle = () => {
    if (!canSort) return;
    const nextSort = header.column.getNextSortingOrder();
    if (nextSort === 'asc') return '点击升序';
    if (nextSort === 'desc') return '点击降序';
    return '取消排序';
  };

  return (
    // 获取当前 header 跨的列 id
    // const leafHeaders = header.getLeafHeaders();
    // const totalWidth = leafHeaders.map(h => columnSizeVars[`--col-${h.id}-size`] || 0).reduce((sum, w) => sum + w, 0);
    // colSpan={header.colSpan}
    <div
      className={classes.th}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{...style, width: `calc(var(--header-${header?.id}-size) * 1px)`}}
    >
      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
      <div className={classes.sortIconGroup} title={getSortTitle()}>
        <button className="button-icon" disabled={!canSort} onClick={sortHandler}>
          <ChevronUp style={{position: 'relative', top: 2, color: sortDir === 'asc' ? 'var(--primary)' : ''}} />
        </button>
        <button className="button-icon" disabled={!canSort} onClick={sortHandler}>
          <ChevronDown style={{position: 'relative', bottom: 2, color: sortDir === 'desc' ? 'var(--primary)' : ''}} />
        </button>
      </div>
      {/* <button className={cn('button-icon', classes.dragIcon)} {...attributes} {...listeners}>
        <IconDragDotVertical />
      </button> */}
      <div
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          header.column.resetSize();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          header.getResizeHandler()(e);
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          header.getResizeHandler()(e);
        }}
        className={cn(classes.resizer, {[classes.isResizing]: header.column.getIsResizing()})}
      ></div>
    </div>
  );
}
