import {CheckCircle2, CircleAlert} from 'lucide-react';
import {Card, CardContent, CardDescription} from '@badnpm/ui';
import WorkflowPanel from './workflow-panel';
import {money, orderLabel, elapsed, type OrderQueueSnapshot} from './order-model';

export default function FulfillmentResults({state}: {state: OrderQueueSnapshot}) {
  const succeeded = state.orders.filter((order) => order.status === 'success');
  const settled = state.orders.filter((order) => order.status === 'success' || order.status === 'failed').length;
  return (
    <WorkflowPanel step="03" title="履约结果" subtitle="成功生成履约单；异常进入待重试列表">
      <div className="grid grid-cols-2 gap-3">
        <Card size="sm" className="bg-emerald-500/5 ring-0">
          <CardContent>
            <CardDescription className="text-xs text-emerald-700 dark:text-emerald-400">成功金额</CardDescription>
            <p className="mt-2 text-xl font-semibold tabular-nums">
              {money.format(succeeded.reduce((sum, order) => sum + order.amount, 0) / 100)}
            </p>
          </CardContent>
        </Card>
        <Card size="sm" className="bg-muted/40 ring-0">
          <CardContent>
            <CardDescription className="text-xs">已处理 / 已接收</CardDescription>
            <p className="mt-2 text-xl font-semibold tabular-nums">
              {settled}
              <span className="text-muted-foreground text-sm"> / {state.orders.length}</span>
            </p>
          </CardContent>
        </Card>
      </div>
      {/* 固定结果区高度，结果新增或错误文案换行时只在区内滚动。 */}
      <div className="h-72 shrink-0 space-y-2 overflow-y-auto p-1">
        {state.orders
          .filter((order) => order.status === 'success' || order.status === 'failed')
          .toReversed()
          .slice(0, 4)
          .map((order) => (
            <Card key={order.id} size="sm">
              <CardContent className="flex items-start gap-2 text-xs">
                {order.status === 'success' ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                ) : (
                  <CircleAlert className="size-4 shrink-0 text-rose-500" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <span className="font-mono">{orderLabel(order.id)}</span>
                    <span className="text-muted-foreground">{elapsed(order, state.now)}</span>
                  </div>
                  <p className="text-muted-foreground mt-1 break-words">{order.error || '库存已锁定，履约单已生成'}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        {!settled && (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 text-xs">
            <CheckCircle2 className="size-6 opacity-40" />
            处理完成后，结果会出现在这里
          </div>
        )}
      </div>
    </WorkflowPanel>
  );
}
