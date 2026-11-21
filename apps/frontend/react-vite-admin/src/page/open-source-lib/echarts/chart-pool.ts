import * as echarts from 'echarts';

const MAX_CHARTS = 5;

class ChartPool {
  private pool: echarts.ECharts[] = [];
  private active = new Map<string, echarts.ECharts>();

  acquire(dom: HTMLElement, chartId: string): echarts.ECharts {
    // 已经存在，直接返回
    if (this.active.has(chartId)) {
      return this.active.get(chartId)!;
    }

    // 超过上限，回收最早的
    if (this.active.size >= MAX_CHARTS) {
      const [oldId] = this.active.keys();
      this.release(oldId);
    }

    const instance = this.pool.pop() ?? echarts.init(dom);

    instance.clear();
    this.active.set(chartId, instance);
    return instance;
  }

  release(chartId: string) {
    const instance = this.active.get(chartId);
    if (!instance) return;

    instance.clear();
    this.active.delete(chartId);
    this.pool.push(instance);
  }

  has(chartId: string) {
    return this.active.has(chartId);
  }

  get(chartId: string) {
    return this.active.get(chartId);
  }
}

export const chartPool = new ChartPool();
