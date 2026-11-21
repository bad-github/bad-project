import {
  createTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type PaginationState,
} from '@tanstack/react-table';
import {describe, expect, test, vi} from 'vitest';
import {clampOrderPagination} from './order-pagination';

type Row = {id: number; status: 'success' | 'failed'};
const makeRows = (count: number): Row[] =>
  Array.from({length: count}, (_, index): Row => ({
    id: index + 1,
    status: index % 2 ? 'failed' : 'success',
  })).toReversed();

function createOrderTable(data: Row[], pagination: PaginationState, filter?: string) {
  const onPaginationChange = vi.fn();
  const table = createTable<Row>({
    data,
    columns: [{accessorKey: 'id'}, {accessorKey: 'status', filterFn: 'equals'}],
    state: {pagination, columnFilters: filter ? [{id: 'status', value: filter}] : []},
    onStateChange: () => {},
    onPaginationChange,
    renderFallbackValue: null,
    getRowId: (row) => String(row.id),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  });
  return {table, onPaginationChange};
}

describe('订单明细分页', () => {
  test('先筛选再分页，分页总数使用筛选结果，订单编号保持稳定', () => {
    const {table} = createOrderTable(makeRows(35), {pageIndex: 1, pageSize: 10}, 'failed');
    expect(table.getPrePaginationRowModel().rows).toHaveLength(17);
    expect(table.getPageCount()).toBe(2);
    expect(table.getRowModel().rows).toHaveLength(7);
    expect(table.getRowModel().rows.map((row) => row.id)).toEqual(['14', '12', '10', '8', '6', '4', '2']);
  });

  test('实时新增订单不会自动回到第一页，状态变化仍更新当前页', async () => {
    const pagination = {pageIndex: 2, pageSize: 10};
    const {table, onPaginationChange} = createOrderTable(makeRows(40), pagination);
    table.getRowModel();
    const data = makeRows(45);
    data[20].status = 'failed';
    table.setOptions((options) => ({...options, data}));
    expect(table.getRowModel().rows[0].original).toEqual(data[20]);
    expect(table.getState().pagination.pageIndex).toBe(2);
    expect(clampOrderPagination(pagination, data.length)).toBe(pagination);
    await Promise.resolve();
    expect(onPaginationChange).not.toHaveBeenCalled();
  });

  test('筛选结果减少时退到有效页，清空后回到首页，后续新增不恢复旧页码', () => {
    const oldPage = {pageIndex: 3, pageSize: 10};
    const clamped = clampOrderPagination(oldPage, 12);
    expect(clamped).toEqual({pageIndex: 1, pageSize: 10});
    const {table} = createOrderTable(makeRows(24), clamped, 'failed');
    expect(table.getRowModel().rows).toHaveLength(2);
    const resetPage = clampOrderPagination(clamped, 0);
    expect(resetPage).toEqual({pageIndex: 0, pageSize: 10});
    expect(clampOrderPagination(resetPage, 100)).toBe(resetPage);
  });

  test('切换每页条数后，分页行模型和总页数随之更新', () => {
    const {table} = createOrderTable(makeRows(45), {pageIndex: 0, pageSize: 20});
    expect(table.getRowModel().rows).toHaveLength(20);
    expect(table.getPageCount()).toBe(3);
    table.setOptions((options) => ({...options, state: {...options.state, pagination: {pageIndex: 0, pageSize: 50}}}));
    expect(table.getRowModel().rows).toHaveLength(45);
    expect(table.getPageCount()).toBe(1);
  });
});
