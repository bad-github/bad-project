import type {ColumnDef} from '@tanstack/react-table';
import {Badge} from '@badnpm/ui';
import {Zap} from 'lucide-react';
import {STATUS, money, orderLabel, elapsed, type Order} from './order-model';

export function createOrderColumns(now: number): ColumnDef<Order>[] {
  return [
    {
      accessorKey: 'id',
      header: '订单 / 客户',
      cell: ({row: {original: order}}) => (
        <>
          <div className="flex items-center gap-1.5 font-mono">
            {orderLabel(order.id)}
            {order.urgent && <Zap aria-label="加急订单" className="size-3 text-amber-500" />}
          </div>
          <div className="text-muted-foreground mt-1">{order.customer}</div>
        </>
      ),
    },
    {
      accessorKey: 'amount',
      header: '来源 / 金额',
      cell: ({row: {original: order}}) => (
        <>
          <div>{money.format(order.amount / 100)}</div>
          <div className="text-muted-foreground mt-1">{order.channel}</div>
        </>
      ),
    },
    {
      accessorKey: 'status',
      header: '状态',
      filterFn: 'equals',
      cell: ({row: {original: order}}) => (
        <>
          <Badge className={STATUS[order.status].className}>{STATUS[order.status].label}</Badge>
          <div className="text-muted-foreground mt-1 max-w-52 whitespace-normal">{order.error || order.stage}</div>
        </>
      ),
    },
    {
      id: 'elapsed',
      header: '处理耗时',
      cell: ({row}) => <span className="font-mono tabular-nums">{elapsed(row.original, now)}</span>,
    },
    {
      accessorKey: 'attempt',
      header: '尝试',
      cell: ({row}) => <span className="tabular-nums">{row.original.attempt}</span>,
    },
  ];
}
