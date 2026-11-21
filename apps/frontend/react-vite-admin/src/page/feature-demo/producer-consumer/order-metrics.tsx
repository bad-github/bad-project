import {Radio, Clock3, Activity, CheckCircle2, CircleAlert} from 'lucide-react';
import MetricCard from './metric-card';
import type {OrderQueueSnapshot} from './order-model';

export default function OrderMetrics({state}: {state: OrderQueueSnapshot}) {
  const succeeded = state.orders.filter((order) => order.status === 'success');
  const failed = state.orders.filter((order) => order.status === 'failed');
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <MetricCard label="已接收" value={state.orders.length} icon={<Radio className="size-4" />} />
      <MetricCard
        label="等待处理"
        value={state.waiting}
        icon={<Clock3 className="size-4" />}
        className="text-amber-600 dark:text-amber-400"
      />
      <MetricCard
        label="正在处理"
        value={state.processing}
        icon={<Activity className="size-4" />}
        className="text-blue-600 dark:text-blue-400"
      />
      <MetricCard
        label="履约成功"
        value={succeeded.length}
        icon={<CheckCircle2 className="size-4" />}
        className="text-emerald-600 dark:text-emerald-400"
      />
      <MetricCard
        label="处理失败"
        value={failed.length}
        icon={<CircleAlert className="size-4" />}
        className="text-rose-600 dark:text-rose-400"
      />
    </div>
  );
}
