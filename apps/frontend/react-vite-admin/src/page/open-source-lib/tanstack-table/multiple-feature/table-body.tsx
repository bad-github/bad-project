import type {RefObject} from 'react';
import type {Row, Table} from '@tanstack/react-table';
import {useVirtualizer} from '@tanstack/react-virtual';
import {horizontalListSortingStrategy, SortableContext} from '@dnd-kit/sortable';
import DragAlongCell from './drag-along-cell';
import VirtualTr from './virtual-tr';
import classes from './index.module.less';

type TProps = {
  table: Table<any>;
  columnOrder: string[];
  parentRef: RefObject<HTMLDivElement>; // 必须非null
  isResizing?: false | string;
};

export const TableBody = (props: TProps) => {
  const {table, columnOrder, isResizing, parentRef} = props;

  const {rows} = table.getRowModel();
  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    estimateSize: () => 32,
    getScrollElement: () => parentRef?.current,
    measureElement:
      isResizing === false && typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 12,
  });

  return (
    <div
      className={classes.tbody}
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
        position: 'relative',
      }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const row = rows[virtualRow.index] as Row<any>;
        return (
          <VirtualTr key={row.id} virtualRow={virtualRow} rowVirtualizer={rowVirtualizer}>
            {row.getVisibleCells().map((cell) => (
              <SortableContext key={cell.id} items={columnOrder} strategy={horizontalListSortingStrategy}>
                {/* // simulate expensive render
                // for (let i = 0; i < 10000; i++) {
                //   Math.random();
                // } */}
                <DragAlongCell key={cell.id} cell={cell} />
              </SortableContext>
            ))}
          </VirtualTr>
        );
      })}
    </div>
  );
};
