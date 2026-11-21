import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortDirection,
  useReactTable,
} from '@tanstack/react-table';
import React, {useMemo, useState} from 'react';
import {makeData, type Person} from '../tool';
import {CompositionInput} from '@badnpm/ui';
import {
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
  BadPagination,
} from '@badnpm/ui';
import {useTranslation} from 'react-i18next';
import IconCaretDown from '@/assets/svg/caret-down-solid.svg?react';
import IconUpDown from '@/assets/svg/caret-up-solid.svg?react';

type ColumnMeta = {
  filterVariant?: 'text' | 'range' | 'select';
};

/** 输入草稿独立于表格筛选值：拼音组合期间只更新输入框，完成输入后再筛选。 */
function TextColumnFilter({column, value}: {column: Column<any, unknown>; value: string}) {
  const [draft, setDraft] = useState({source: value, text: value});
  // 外部重置筛选时同步草稿；有条件地调整本组件状态，避免 Effect 中同步 setState。
  if (draft.source !== value) {
    setDraft({source: value, text: value});
  }

  return (
    <CompositionInput
      className="h-8 w-24"
      placeholder="请输入"
      type="text"
      value={draft.text}
      onChange={(event) => setDraft({source: value, text: event.currentTarget.value})}
      onFinalChange={(nextValue) => column.setFilterValue(nextValue)}
    />
  );
}

const Filter = ({column}: {column: Column<any, unknown>}) => {
  const columnFilterValue = column.getFilterValue();
  const {filterVariant} = (column.columnDef.meta as ColumnMeta) ?? {};

  switch (filterVariant) {
    case 'range':
      return (
        <div>
          <div className="flex gap-2">
            <Input
              type="number"
              value={(columnFilterValue as [number, number])?.[0] ?? ''}
              onChange={(e) => column.setFilterValue((old: [number, number]) => [e.target.value, old?.[1]])}
              placeholder={`Min`}
              className="h-8 w-24"
            />
            <Input
              type="number"
              value={(columnFilterValue as [number, number])?.[1] ?? ''}
              onChange={(e) => column.setFilterValue((old: [number, number]) => [old?.[0], e.target.value])}
              placeholder={`Max`}
              className="h-8 w-24"
            />
          </div>
        </div>
      );
    case 'select':
      return (
        <Select
          items={['complicated', 'relationship', 'single'].map((value) => ({value, label: value}))}
          onValueChange={(value) => column.setFilterValue(value)}
          value={columnFilterValue?.toString() || null}
        >
          <SelectTrigger size="sm" className="w-32 border-1">
            <SelectValue placeholder="请选择" />
          </SelectTrigger>
          <SelectContent>
            {['complicated', 'relationship', 'single'].map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'text':
      return <TextColumnFilter column={column} value={(columnFilterValue ?? '') as string} />;
    default:
      return null;
  }
};

export default function ColumnFilterTable() {
  const {t} = useTranslation();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const columns = useMemo<ColumnDef<Person, any>[]>(
    () => [
      {
        accessorKey: 'firstName',
        cell: (info) => info.getValue(),
      },
      {
        accessorFn: (row) => row.lastName,
        id: 'lastName',
        cell: (info) => info.getValue(),
        header: () => <span>Last Name</span>,
      },
      {
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        id: 'fullName',
        header: 'Full Name',
        cell: (info) => info.getValue(),
        meta: {
          filterVariant: 'text',
        },
      },
      {
        accessorKey: 'age',
        header: () => 'Age',
        meta: {
          filterVariant: 'range',
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        meta: {
          filterVariant: 'select',
        },
      },
      {
        accessorKey: 'progress',
        header: 'Progress',
      },
    ],
    []
  );
  const sortMap = useMemo(
    () => ({
      asc: <IconUpDown className="fill-primary inline-block size-4" />,
      desc: <IconCaretDown className="fill-primary inline-block size-4" />,
    }),
    []
  );
  const [data, _setData] = React.useState<Person[]>(() => makeData(5000));
  const table = useReactTable({
    data,
    columns,
    // 自定义的筛选函数集合（现在为空对象，表示用默认的）
    filterFns: {},
    // 外部控制的筛选状态（可以用 React 的 useState 控制）
    state: {columnFilters},
    // 当筛选条件变动时的回调函数（更新你的状态）
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // debugTable: true,
    // debugHeaders: true,
    // debugColumns: false
  });

  return (
    <div>
      <Table className="border-collapse border-1">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead className="border-1" key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder ? null : (
                    <>
                      <div
                        className={cn(header.column.getCanSort() && 'cursor-pointer select-none')}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        {sortMap[header.column.getIsSorted() as SortDirection]}
                      </div>
                      {header.column.getCanFilter() && <Filter column={header.column} />}
                    </>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell className="border-1" key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* 
      table api还提供了以下：
      页码总数: table.getPageCount() 
      上一页：table.previousPage()，table.getCanPreviousPage()
      下一页：table.nextPage()，table.getCanNextPage()
      但这些在组件里面都是封装好了的
      */}
      <BadPagination
        showSizeChanger
        showQuickJumper
        showTotal={(total) => t('ui.total', {total})}
        previousContent={t('ui.previous')}
        nextContent={t('ui.next')}
        // 页码是从0开始的
        current={table.getState().pagination.pageIndex + 1}
        pageSize={table.getState().pagination.pageSize}
        total={table.getPrePaginationRowModel().rows.length}
        onChange={(page, pageSize) => {
          table.setPagination({pageIndex: page - 1, pageSize});
        }}
      />
    </div>
  );
}
