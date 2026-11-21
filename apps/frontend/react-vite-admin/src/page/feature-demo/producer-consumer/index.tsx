import {useState} from 'react';
import OrderHeader from './order-header';
import QueueControls from './queue-controls';
import OrderMetrics from './order-metrics';
import QueueStatus from './queue-status';
import WaitingQueue from './waiting-queue';
import ProcessingSlots from './processing-slots';
import FulfillmentResults from './fulfillment-results';
import OrderTable from './order-table';
import ActivityFeed from './activity-feed';
import type {OrderStatus} from './order-model';
import {useOrderQueue} from './use-order-queue';

export default function ProducerConsumerPage() {
  const {snapshot: state, start, setTraffic, setTotal, togglePause, drain, retryFailed, reset} = useOrderQueue();
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const resetBatch = () => {
    reset();
    setFilter('all');
  };
  return (
    <div className="h-full space-y-5 overflow-y-auto p-4 [overflow-anchor:none] lg:p-6">
      <OrderHeader state={state} start={start} drain={drain} reset={resetBatch} />
      <QueueControls
        state={state}
        setTraffic={setTraffic}
        setTotal={setTotal}
        togglePause={togglePause}
        retryFailed={retryFailed}
      />
      <OrderMetrics state={state} />
      <QueueStatus state={state} />
      <div className="grid gap-4 xl:grid-cols-3">
        <WaitingQueue state={state} />
        <ProcessingSlots state={state} />
        <FulfillmentResults state={state} />
      </div>
      {/* 与上方共用三等分列，订单明细跨两列，分界线保持一致。 */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <OrderTable state={state} filter={filter} setFilter={setFilter} />
        </div>
        <ActivityFeed activities={state.activities} />
      </div>
    </div>
  );
}
