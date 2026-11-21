import {RULES} from './order-model';

export default function BacklogChart({history}: {history: number[]}) {
  const points = history
    .map((value, index) => `${(index / Math.max(1, history.length - 1)) * 280},${56 - (value / RULES.maxWaiting) * 48}`)
    .join(' ');
  return (
    <div className="bg-muted/40 rounded-lg p-3">
      <div className="text-muted-foreground mb-2 flex justify-between text-xs">
        <span>等待队列趋势 · 每秒采样</span>
        <span>上限 {RULES.maxWaiting} 单</span>
      </div>
      <svg
        viewBox="0 0 280 64"
        preserveAspectRatio="none"
        className="h-16 w-full"
        role="img"
        aria-label={`最近 ${history.length} 个采样点的等待订单数：${history.join('、')}`}
      >
        <path d="M0 56 H280" stroke="currentColor" className="text-border" fill="none" />
        <polygon points={`0,56 ${points} 280,56`} className="fill-amber-500/10" />
        <polyline
          points={points}
          className="stroke-amber-500"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          fill="none"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
