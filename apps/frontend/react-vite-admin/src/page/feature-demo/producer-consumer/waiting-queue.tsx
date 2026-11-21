import {Badge, Progress} from '@badnpm/ui';
import {Package} from 'lucide-react';
import BacklogChart from './backlog-chart';
import WorkflowPanel from './workflow-panel';
import {RULES, orderLabel, type OrderQueueSnapshot} from './order-model';

export default function WaitingQueue({state}: {state: OrderQueueSnapshot}) {
  const waiting = state.orders
    .filter((order) => order.status === 'waiting')
    .sort((a, b) => Number(b.urgent) - Number(a.urgent) || a.queuedAt - b.queuedAt);
  return (
    <WorkflowPanel step="01" title="商城接单 → 等待队列" subtitle="商城持续接入；加急订单优先出队">
      <div className="flex items-center justify-between text-sm">
        <span>等待容量</span>
        <span className="font-mono tabular-nums">
          {state.waiting} / {RULES.maxWaiting}
        </span>
      </div>
      <Progress value={(state.waiting / RULES.maxWaiting) * 100} aria-label="等待队列容量" />
      {/* 预留四条订单及剩余数量提示的空间，避免出入队时页面高度变化。 */}
      <div className="min-h-44 flex-1 space-y-2">
        {waiting.slice(0, 4).map((order, index) => (
          <div key={order.id} className="bg-muted/40 flex h-8 items-center gap-2 rounded-lg px-3 text-xs">
            <span className="text-muted-foreground w-3 tabular-nums">{index + 1}</span>
            <span className="font-mono">{orderLabel(order.id)}</span>
            <span className="text-muted-foreground">{order.customer}</span>
            {order.urgent && <Badge className="ml-auto bg-amber-500/10 text-amber-700 dark:text-amber-400">加急</Badge>}
          </div>
        ))}
        {!waiting.length && (
          <div className="text-muted-foreground flex min-h-36 flex-col items-center justify-center gap-2 text-xs">
            <Package className="size-6 opacity-40" />
            {state.orders.length ? '暂无等待订单' : '等待商城推送第一笔订单'}
          </div>
        )}
        {waiting.length > 4 && (
          <p className="text-muted-foreground text-center text-xs">还有 {waiting.length - 4} 笔等待处理</p>
        )}
      </div>
      <BacklogChart history={state.history} />
    </WorkflowPanel>
  );
}
