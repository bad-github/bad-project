import {Card, CardContent, Progress} from '@badnpm/ui';
import {ArrowRight} from 'lucide-react';
import WorkflowPanel from './workflow-panel';
import {RULES, orderLabel, elapsed, type OrderQueueSnapshot} from './order-model';

export default function ProcessingSlots({state}: {state: OrderQueueSnapshot}) {
  const processing = state.orders.filter((order) => order.status === 'processing');
  return (
    <WorkflowPanel
      step="02"
      title="库存与履约服务"
      subtitle={`最多 ${RULES.concurrency} 个并发 · 每秒最多启动 ${RULES.intervalCap} 笔 · ${RULES.timeout / 1000}s 超时`}
    >
      {Array.from({length: RULES.concurrency}, (_, index) => {
        const order = processing[index];
        return (
          <Card
            key={index}
            size="sm"
            className={order ? 'bg-blue-500/5 ring-blue-500/25' : 'border border-dashed ring-0'}
          >
            <CardContent>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">并发槽位 {index + 1}</span>
                {order ? (
                  <span className="font-mono text-blue-600 dark:text-blue-400">{orderLabel(order.id)}</span>
                ) : (
                  <span className="text-muted-foreground">空闲</span>
                )}
              </div>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span>
                  {order?.stage ??
                    (state.paused
                      ? '已暂停分配'
                      : state.rateLimited && state.waiting
                        ? '等待下一限流窗口'
                        : '等待新订单')}
                </span>
                <span className="text-muted-foreground tabular-nums">{order ? elapsed(order, state.now) : '—'}</span>
              </div>
              <Progress
                value={
                  order && order.startedAt !== null
                    ? Math.min(95, ((state.now - order.startedAt) / order.duration) * 100)
                    : 0
                }
                aria-label={`槽位 ${index + 1} 的处理进度`}
              />
            </CardContent>
          </Card>
        );
      })}
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <ArrowRight className="size-3.5" />
        加急只能优先分配，不能抢占已运行的任务。
      </p>
    </WorkflowPanel>
  );
}
