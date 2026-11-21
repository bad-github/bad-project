import type {UniqueIdentifier} from '@dnd-kit/core';
import {i18n} from '@/i18n';

export type TSortItem = {
  id: UniqueIdentifier;
  disabled?: boolean;
  [key: string]: any;
};

export type TColumn = {
  data: TSortItem[];
  isFetching: boolean;
};

export const ApiMap: Record<string, {count: number; color: string}> = {
  A: {count: 15, color: 'var(--chart-1)'},
  B: {count: 0, color: 'var(--chart-2)'},
  C: {count: 6, color: 'var(--chart-3)'},
  D: {count: 3, color: 'var(--chart-4)'},
};

// 垃圾箱
export const TRASH_ID = 'void';
// 占位空列
export const PLACEHOLDER_ID = 'placeholder';
// 模拟数据：type C 不能放置 type A 的数据
export const DestinationNotAllowed: Record<string, {notAccepts: string[]; tip?: string}> = {
  // 目标列：不允许放置数据类型
  C: {
    notAccepts: ['A'],
    // i18n.t
    // tip: 'C 列不允许放置 A 列的数据',
    tip: i18n.t('lib.columnCannotAcceptData', {target: 'C', source: 'A'}),
  },
};
