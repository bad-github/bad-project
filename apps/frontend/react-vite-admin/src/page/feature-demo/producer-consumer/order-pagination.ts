import type {PaginationState} from '@tanstack/react-table';

/** 数据减少时退回最后一个有效页，增加或状态更新时保留当前页。 */
export function clampOrderPagination(pagination: PaginationState, rowCount: number): PaginationState {
  const lastPage = Math.max(0, Math.ceil(rowCount / pagination.pageSize) - 1);
  return pagination.pageIndex > lastPage ? {...pagination, pageIndex: lastPage} : pagination;
}
