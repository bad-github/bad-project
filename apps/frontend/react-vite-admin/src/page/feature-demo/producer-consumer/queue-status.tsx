import {RULES, type OrderQueueSnapshot} from './order-model';

export default function QueueStatus({state}: {state: OrderQueueSnapshot}) {
  const status = state.draining
    ? '正在收尾'
    : state.backpressure
      ? '积压保护中'
      : state.paused
        ? '处理已暂停'
        : state.producing
          ? '正在接单'
          : state.processing + state.waiting > 0
            ? '正在处理'
            : state.orders.length
              ? '批次处理完成'
              : '等待开始';
  return (
    <div className="flex items-center gap-2 text-sm" role="status" aria-live="polite">
      <span
        className={`size-2 rounded-full ${state.producing && !state.backpressure ? 'bg-emerald-500 motion-safe:animate-pulse' : 'bg-amber-500'}`}
      />
      <span className="shrink-0 font-medium">{status}</span>
      <span className="text-muted-foreground">
        {state.backpressure
          ? `等待达到 ${RULES.maxWaiting} 单后暂缓接入，回落至 ${RULES.lowWater} 单后自动恢复。`
          : state.draining
            ? '已停止接入新订单，正在处理剩余订单。'
            : '加急订单优先分配，异常订单可重试。'}
      </span>
    </div>
  );
}
