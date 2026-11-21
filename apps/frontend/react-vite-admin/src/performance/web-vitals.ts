import type {Metric} from 'web-vitals';

/**
 * 监听三项核心指标（LCP、INP、CLS）及辅助排查指标（TTFB、FCP）。
 * 指标产生或更新时调用 onMetric；同一指标可能回调多次，后续上报时应按 metric.id 保留最新值。
 */
export function observeWebVitals(onMetric: (metric: Metric) => void): void {
  // 页面渲染后再加载监控代码；web-vitals 会读取浏览器已缓存的性能记录。
  void import('web-vitals')
    .then(({onCLS, onFCP, onINP, onLCP, onTTFB}) => {
      onCLS(onMetric);
      onFCP(onMetric);
      onINP(onMetric);
      onLCP(onMetric);
      onTTFB(onMetric);
    })
    .catch((error: unknown) => {
      console.error('Failed to load web-vitals', error);
    });
}
