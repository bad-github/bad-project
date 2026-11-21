import {useTranslation} from 'react-i18next';

import {BadEmpty} from '@badnpm/ui';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  type ExpandedState,
  type Row,
  type Table,
  type TableOptions,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {useVirtualizer} from '@tanstack/react-virtual';
import classes from './table-div.module.less';
import useScrollable from '@/hooks/use-scrollable';
import {number} from '@workspace/utils';

type TanstackTableProps<T> = Omit<TableOptions<T>, 'getCoreRowModel'> & {
  height?: number | string;
  virtual?: boolean;
  style?: React.CSSProperties;
};

type TableBodyProps = {
  table: Table<any>;
  tbodyWrapperRef: React.RefObject<HTMLDivElement | null>;
};

export default function TanstackTableDiv<T>(props: TanstackTableProps<T>) {
  const {data, columns: _columns, virtual, style, height = style?.height || 400} = props;
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const theadWrapperRef = useRef<HTMLDivElement>(null);
  const {ref: tbodyWrapperRef, isScrollable, scrollbarWidth} = useScrollable();
  const [virtualHeight, setVirtualHeight] = useState(0);

  const finalStyle = useMemo(() => {
    if (data.length > 0) {
      return {...style, maxHeight: virtual ? height : '100%'};
    }
    return {};
  }, [style, virtual, height, data.length]);

  useEffect(() => {
    if (!virtual) return;
    const theadHeight = theadWrapperRef.current?.offsetHeight;
    if (number.isNumeric(height)) {
      setVirtualHeight(Number(height) - (theadHeight || 0));
    }
  }, [virtual]);

  const table = useReactTable<T>({
    state: {
      expanded,
    },
    ...(props.initialState?.expanded ? {} : {onExpandedChange: setExpanded}),
    getSubRows: (row: any) => row.subRows,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    // 若要默认全部展开，则需要加上initialState: {expanded: true},同时需要删除onExpandedChange以及state:{expanded}
    ...props,
  });

  // 表头和表体是分开的，表头需要跟随表体滚动
  const handleBodyScroll = () => {
    if (!tbodyWrapperRef.current || !theadWrapperRef.current) return;
    const scrollLeft = tbodyWrapperRef.current.scrollLeft;
    if (!theadWrapperRef.current) return;
    theadWrapperRef.current.scrollLeft = scrollLeft;
  };

  return (
    <div className={classes.table} style={finalStyle}>
      <div
        className={classes.thead}
        ref={theadWrapperRef}
        style={{
          ...({'--th-scroll-width': isScrollable ? `${scrollbarWidth}px` : 0} as any),
        }}
      >
        {table.getHeaderGroups().map((headerGroup) => (
          <div className={classes.tr} key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <div
                  className={classes.th}
                  key={header.id}
                  style={{width: header.getSize(), minWidth: header.getSize()}}
                >
                  <div>{flexRender(header.column.columnDef.header, header.getContext())}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {virtual ? (
        <div
          ref={tbodyWrapperRef}
          onScroll={handleBodyScroll}
          style={{position: 'relative', maxHeight: virtualHeight, overflow: 'auto'}}
        >
          <VirtualTableBody table={table} tbodyWrapperRef={tbodyWrapperRef} />
        </div>
      ) : (
        <div className={classes.tbody} ref={tbodyWrapperRef} onScroll={handleBodyScroll}>
          {table.getRowModel().rows.map((row) => {
            return (
              <div className={classes.tr} key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  return (
                    <div
                      className={classes.td}
                      key={cell.id}
                      style={{width: cell.column.getSize(), minWidth: cell.column.getSize()}}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  );
                })}
              </div>
            );
          })}
          <TBodyEmpty table={table} />
        </div>
      )}
    </div>
  );
}

function VirtualTableBody({table, tbodyWrapperRef}: TableBodyProps) {
  const {rows} = table.getRowModel();
  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    estimateSize: () => 32,
    getScrollElement: () => tbodyWrapperRef.current,
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 0,
  });

  return (
    <>
      <tbody className={classes.tbody} style={{height: `${rowVirtualizer.getTotalSize()}px`}}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index] as Row<any>;
          return (
            <tr
              className={classes.tr}
              data-index={virtualRow.index}
              ref={(node) => rowVirtualizer.measureElement(node)}
              key={row.id}
              style={{transform: `translateY(${virtualRow.start}px)`, position: 'absolute'}}
            >
              {row.getVisibleCells().map((cell) => {
                return (
                  <td
                    className={classes.td}
                    key={cell.id}
                    style={{width: cell.column.getSize(), minWidth: cell.column.getSize()}}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
      <TBodyEmpty table={table} />
    </>
  );
}

function TBodyEmpty({table}: Omit<TableBodyProps, 'tbodyWrapperRef'>) {
  const {t} = useTranslation();
  return (
    <>
      {table.getRowModel().rows.length === 0 && (
        <div className="py-2" style={{width: table.getTotalSize()}}>
          <BadEmpty text={t('common.no-data')} />
        </div>
      )}
    </>
  );
}
