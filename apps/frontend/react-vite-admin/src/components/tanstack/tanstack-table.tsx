import {useTranslation} from 'react-i18next';

import {BadEmpty} from '@badnpm/ui';
import React, {useMemo, useRef, useState} from 'react';
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
import classes from './table.module.less';

type TanstackTableProps<T> = Omit<TableOptions<T>, 'getCoreRowModel'> & {
  height?: number | string;
  virtual?: boolean;
  style?: React.CSSProperties;
};

type TableBodyProps = {
  table: Table<any>;
  tableContainerRef: React.RefObject<HTMLDivElement | null>;
};

export default function TanstackTable<T>(props: TanstackTableProps<T>) {
  const {data, columns: _columns, virtual, style, height = style?.height || 400} = props;
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const finalStyle = useMemo(() => {
    if (data.length > 0) {
      return {...style, maxHeight: virtual ? height : '100%'};
    }
    return {};
  }, [style, virtual, height, data.length]);

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
  return (
    <div ref={tableContainerRef} className={classes.tableContainer} style={finalStyle}>
      <table className={classes.table}>
        <thead className={classes.thead}>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr className={classes.tr} key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th
                    className={classes.th}
                    key={header.id}
                    style={{width: header.getSize(), minWidth: header.getSize()}}
                  >
                    <div>{flexRender(header.column.columnDef.header, header.getContext())}</div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        {virtual && tableContainerRef.current ? (
          <VirtualTableBody table={table} tableContainerRef={tableContainerRef} />
        ) : (
          <TableBody table={table} />
        )}
      </table>
    </div>
  );
}

function TableBody({table}: Omit<TableBodyProps, 'tableContainerRef'>) {
  const {rows} = table.getRowModel();
  return (
    <>
      <tbody className={classes.tbody}>
        {rows.map((row) => {
          return (
            <tr className={classes.tr} key={row.id}>
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

function VirtualTableBody({table, tableContainerRef}: TableBodyProps) {
  const {rows} = table.getRowModel();
  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    estimateSize: () => 32,
    getScrollElement: () => tableContainerRef.current,
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

function TBodyEmpty({table}: Omit<TableBodyProps, 'tableContainerRef'>) {
  const {t} = useTranslation();
  return (
    <>
      {table.getRowModel().rows.length === 0 && (
        <tbody className={classes.tbody}>
          <tr style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120}}>
            <BadEmpty text={t('common.no-data')} />
          </tr>
        </tbody>
      )}
    </>
  );
}
