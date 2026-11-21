import type {Metric} from 'web-vitals';

/**
 * 上报入口：未配置 VITE_WEB_VITALS_ENDPOINT 时不发送请求，开发环境仍可在控制台查看指标。
 * 接收端应按 id 去重并保存最新的 value；CLS 是无单位分数，其余指标的单位是毫秒。
 */
export function reportWebVital(metric: Metric): void {
  return;
  if (import.meta.env.DEV) {
    console.info('[web-vitals]', metric);
  }

  const endpoint = import.meta.env.VITE_WEB_VITALS_ENDPOINT?.trim();
  if (!endpoint) return;

  // 只发送路径，不发送可能含有个人信息的查询参数或 hash；不发送原始 PerformanceEntry。
  const path = new URL(metric.navigationURL ?? location.href, location.href).pathname;
  const body = JSON.stringify({
    id: metric.id,
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    navigationType: metric.navigationType,
    path,
    reportedAt: new Date().toISOString(),
  });

  /**
   * sendBeacon
   * 主要用于向服务端发送少量统计、日志数据，特别适合页面关闭或跳转时上报。
   * 它发送的是 HTTP POST 请求。返回 true 表示浏览器接受了发送任务，不代表服务端已成功收到。
   */
  const data = new Blob([body], {type: 'application/json'});
  if (navigator.sendBeacon?.(endpoint, data)) return;
  void fetch(endpoint, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body,
    // 允许请求在页面离开后继续发送，但同样存在数据量限制，也不保证送达。
    keepalive: true,
  }).catch((error: unknown) => {
    if (import.meta.env.DEV) console.warn('Failed to report web-vitals', error);
  });
}
