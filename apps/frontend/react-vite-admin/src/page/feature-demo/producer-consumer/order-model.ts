export const RULES = {
  concurrency: 3,
  intervalCap: 2,
  interval: 1000,
  timeout: 3500,
  maxWaiting: 10,
  lowWater: 3,
};
export const TRAFFIC_PROFILES = {
  normal: {label: '日常 · 1 单/秒', intervalMs: 1000},
  busy: {label: '繁忙 · 约 3 单/秒', intervalMs: 333},
  promotion: {label: '促销 · 8 单/秒', intervalMs: 125},
  peak: {label: '峰值 · 约 15 单/秒', intervalMs: 67},
};
export type Traffic = keyof typeof TRAFFIC_PROFILES;
export const BATCH_SIZES = [30, 60, 100, 200] as const;
export type BatchSize = (typeof BATCH_SIZES)[number];
export const DEFAULT_BATCH_SIZE: BatchSize = 30;
export type OrderStatus = 'waiting' | 'processing' | 'success' | 'failed';
export type Order = {
  id: number;
  customer: string;
  channel: string;
  amount: number;
  urgent: boolean;
  status: OrderStatus;
  attempt: number;
  receivedAt: number;
  queuedAt: number;
  startedAt: number | null;
  finishedAt: number | null;
  duration: number;
  stage: string;
  error: string;
};
export type Activity = {id: number; at: number; message: string; tone: 'info' | 'success' | 'warning'};
export type OrderQueueSnapshot = {
  orders: Order[];
  activities: Activity[];
  history: number[];
  producing: boolean;
  draining: boolean;
  paused: boolean;
  backpressure: boolean;
  rateLimited: boolean;
  traffic: Traffic;
  total: BatchSize;
  waiting: number;
  processing: number;
  now: number;
};

export const STATUS: Record<OrderStatus, {label: string; className: string}> = {
  waiting: {label: '等待处理', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400'},
  processing: {label: '处理中', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400'},
  success: {label: '履约成功', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'},
  failed: {label: '处理失败', className: 'bg-rose-500/10 text-rose-700 dark:text-rose-400'},
};
export const money = new Intl.NumberFormat('zh-CN', {style: 'currency', currency: 'CNY'});
export const clock = new Intl.DateTimeFormat('zh-CN', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

export function elapsed(order: Order, now: number) {
  if (order.startedAt === null) return '—';
  return `${((Math.max(order.startedAt, order.finishedAt ?? now) - order.startedAt) / 1000).toFixed(1)}s`;
}

export function orderLabel(id: number) {
  return `SO-${String(id).padStart(4, '0')}`;
}
