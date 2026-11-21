import {useId} from 'react';
import {Pause, Play} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@badnpm/ui';
import InfoTip from './info-tip';
import {
  BATCH_SIZES,
  RULES,
  TRAFFIC_PROFILES,
  type BatchSize,
  type OrderQueueSnapshot,
  type Traffic,
} from './order-model';

type Props = {
  state: OrderQueueSnapshot;
  setTraffic: (traffic: Traffic) => void;
  setTotal: (total: BatchSize) => void;
  togglePause: () => void;
  retryFailed: () => void;
};
const trafficOptions = Object.entries(TRAFFIC_PROFILES).map(([value, profile]) => ({
  value: value as Traffic,
  label: profile.label,
}));
const batchOptions = BATCH_SIZES.map((value) => ({value, label: `${value} 单`}));

export default function QueueControls({state, setTraffic, setTotal, togglePause, retryFailed}: Props) {
  const trafficId = useId();
  const totalId = useId();
  const failedCount = state.orders.filter((order) => order.status === 'failed').length;
  const batchLocked = state.orders.length > 0 || state.producing || state.draining;
  return (
    <Card size="sm" className="bg-muted/40">
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor={trafficId} className="text-muted-foreground">
              上游流量
            </Label>
            <Select<Traffic>
              items={trafficOptions}
              value={state.traffic}
              disabled={state.draining}
              onValueChange={(value) => {
                if (value !== null) setTraffic(value);
              }}
            >
              <SelectTrigger id={trafficId} className="min-w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {trafficOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor={totalId} className="text-muted-foreground">
              批次订单量
            </Label>
            <Select<BatchSize>
              items={batchOptions}
              value={state.total}
              disabled={batchLocked}
              onValueChange={(value) => {
                if (value !== null) setTotal(value);
              }}
            >
              <SelectTrigger id={totalId} className="min-w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {batchOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-muted-foreground text-xs">
            已接收 {state.orders.length} / {state.total} 单{batchLocked ? ' · 重置批次后可调整数量' : ''}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={togglePause}
            disabled={state.draining || !state.orders.length}
          >
            {state.paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
            {state.paused ? '恢复处理' : '暂停处理'}
            <InfoTip>暂停后不再分配新订单，正在执行的任务继续完成；上游仍会接单，达到队列上限后暂缓拉取。</InfoTip>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={retryFailed}
            disabled={!failedCount || state.draining || state.waiting >= RULES.maxWaiting}
          >
            重试失败订单（{failedCount}）
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
