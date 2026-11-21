import {RotateCcw, CheckCircle2, Play} from 'lucide-react';
import {Button} from '@badnpm/ui';
import type {OrderQueueSnapshot} from './order-model';

export default function OrderHeader({
  state,
  start,
  drain,
  reset,
}: {
  state: OrderQueueSnapshot;
  start: () => void;
  drain: () => void;
  reset: () => void;
}) {
  const complete = state.orders.length >= state.total;
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">实时订单履约台</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
          统一接入商城订单，按优先级调度库存与履约服务，跟踪处理进度与异常订单。
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" onClick={reset}>
          <RotateCcw className="size-4" />
          重置批次
        </Button>
        {state.producing || state.draining ? (
          <Button type="button" onClick={drain} disabled={state.draining}>
            <CheckCircle2 className="size-4" />
            {state.draining ? '正在处理剩余订单' : '停止接单并收尾'}
          </Button>
        ) : (
          <Button type="button" onClick={start} disabled={complete}>
            <Play className="size-4" />
            {complete ? `本批次已接满 ${state.total} 单` : state.orders.length ? '继续接单' : '开始接单'}
          </Button>
        )}
      </div>
    </header>
  );
}
