import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  BadPagination,
} from '@badnpm/ui';
import {useMemo, useState} from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type PaginationState,
} from '@tanstack/react-table';
import {createOrderColumns} from './order-columns';
import {clampOrderPagination} from './order-pagination';
import {STATUS, type OrderQueueSnapshot, type OrderStatus} from './order-model';

const statusOptions: {value: OrderStatus | 'all'; label: string}[] = [
  {value: 'all', label: '全部状态'},
  ...Object.entries(STATUS).map(([value, item]) => ({value: value as OrderStatus, label: item.label})),
];

export default function OrderTable({
  state,
  filter,
  setFilter,
}: {
  state: OrderQueueSnapshot;
  filter: OrderStatus | 'all';
  setFilter: (filter: OrderStatus | 'all') => void;
}) {
  'use no memo';

  const [pagination, setPagination] = useState<PaginationState>({pageIndex: 0, pageSize: 10});
  const data = useMemo(() => state.orders.toReversed(), [state.orders]);
  const columns = useMemo(() => createOrderColumns(state.now), [state.now]);
  const filteredCount = data.filter((order) => filter === 'all' || order.status === filter).length;
  const validPagination = clampOrderPagination(pagination, filteredCount);
  // 在同一组件内同步校正越界页，避免实时状态变化或重置后短暂出现空白页。
  if (validPagination !== pagination) setPagination(validPagination);
  // 本组件使用 TanStack 可变实例，已用 use no memo 退出编译器记忆化。
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table 使用可变实例 API。
  const table = useReactTable({
    data,
    columns,
    state: {pagination: validPagination, columnFilters: filter === 'all' ? [] : [{id: 'status', value: filter}]},
    onPaginationChange: setPagination,
    getRowId: (order) => String(order.id),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // 每 200ms 的数据刷新不应把用户从其他页送回首页。
    autoResetPageIndex: false,
  });
  const rows = table.getRowModel().rows;
  const {pageIndex, pageSize} = table.getState().pagination;
  const total = table.getPrePaginationRowModel().rows.length;
  return (
    <Card className="min-w-0 gap-0 py-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b p-4">
        <CardTitle>
          <h2>
            订单明细 <span className="text-muted-foreground ml-1 text-xs font-normal">{state.orders.length} 笔</span>
          </h2>
        </CardTitle>
        <Select<OrderStatus | 'all'>
          items={statusOptions}
          value={filter}
          onValueChange={(value) => {
            if (value !== null) {
              setFilter(value);
              table.resetPageIndex();
            }
          }}
        >
          <SelectTrigger size="sm" aria-label="筛选订单状态" className="min-w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      {/* 固定表格视口，接单、筛选和翻页时不改变页面总高度。 */}
      <CardContent className="px-0 [&>[data-slot=table-container]]:h-96 [&>[data-slot=table-container]]:overflow-auto">
        <Table aria-label="订单明细" className="text-xs">
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id} scope="col" className="px-4 py-3">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {!rows.length && (
              <TableRow>
                <TableCell
                  colSpan={table.getVisibleLeafColumns().length}
                  className="text-muted-foreground p-10 text-center text-sm"
                >
                  {state.orders.length ? '当前状态没有订单' : '暂无订单，开始接单后将在此显示。'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="min-h-16 flex-wrap gap-2">
        {total ? (
          <BadPagination
            current={pageIndex + 1}
            pageSize={pageSize}
            total={total}
            pageSizeOptions={[10, 20, 50]}
            showSizeChanger
            showQuickJumper
            showTotal
            onChange={(current, nextSize) => table.setPagination({pageIndex: current - 1, pageSize: nextSize})}
          />
        ) : (
          <span className="text-muted-foreground text-xs">共 0 条</span>
        )}
      </CardFooter>
    </Card>
  );
}
