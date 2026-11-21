import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {createOrderQueue, type OrderQueue} from './order-queue';
import {
  RULES,
  BATCH_SIZES,
  DEFAULT_BATCH_SIZE,
  TRAFFIC_PROFILES,
  type OrderQueueSnapshot,
  type Traffic,
} from './order-model';

const queues: OrderQueue[] = [];
function create(onChange: (snapshot: OrderQueueSnapshot) => void = () => {}) {
  const queue = createOrderQueue(onChange);
  queues.push(queue);
  return queue;
}
beforeEach(() => vi.useFakeTimers());
afterEach(async () => {
  for (const queue of queues.splice(0)) queue.dispose();
  await vi.advanceTimersByTimeAsync(10000);
  vi.useRealTimers();
});

describe('订单生产与消费', () => {
  test.each(BATCH_SIZES)('批次选择 %i 单后准确接满并自动收尾', async (total) => {
    const queue = create();
    queue.setTotal(total);
    queue.setTraffic('peak');
    queue.start();
    // 已开始接单后数量锁定，不能被后续配置改写。
    queue.setTotal(total === 30 ? 60 : 30);
    expect(queue.snapshot().total).toBe(total);
    await vi.advanceTimersByTimeAsync(total * 2000 + 10000);
    const state = queue.snapshot();
    expect(state.orders).toHaveLength(total);
    expect(state.total).toBe(total);
    expect(state.producing || state.draining).toBe(false);
    expect(state.waiting + state.processing).toBe(0);
    expect(state.orders.every((order) => order.status === 'success' || order.status === 'failed')).toBe(true);
  });

  test.each(Object.keys(TRAFFIC_PROFILES) as Traffic[])('上游流量 %s 按对应间隔接入订单', async (traffic) => {
    const queue = create();
    queue.setTraffic(traffic);
    queue.start();
    await vi.advanceTimersByTimeAsync(TRAFFIC_PROFILES[traffic].intervalMs * 3);
    expect(queue.snapshot().orders).toHaveLength(4);
    expect(queue.snapshot().traffic).toBe(traffic);
  });

  test('运行中切换流量立即应用新间隔，重置实例可以保留所选配置', async () => {
    const queue = create();
    queue.setTotal(100);
    queue.start();
    await vi.advanceTimersByTimeAsync(200);
    queue.setTraffic('peak');
    await vi.advanceTimersByTimeAsync(TRAFFIC_PROFILES.peak.intervalMs);
    expect(queue.snapshot().orders).toHaveLength(2);
    const previous = queue.snapshot();
    queue.dispose();
    const fresh = createOrderQueue(() => {}, {total: previous.total, traffic: previous.traffic});
    queues.push(fresh);
    expect(fresh.snapshot().orders).toHaveLength(0);
    expect(fresh.snapshot().total).toBe(100);
    expect(fresh.snapshot().traffic).toBe('peak');
    fresh.setTotal(200);
    expect(fresh.snapshot().total).toBe(200);
  });

  test('重复开始不创建多个生产循环，始终遵守等待容量和并发限制', async () => {
    const snapshots: OrderQueueSnapshot[] = [];
    const queue = create((snapshot) => snapshots.push(snapshot));
    queue.start();
    queue.start();
    await vi.advanceTimersByTimeAsync(1000);
    expect(queue.snapshot().orders).toHaveLength(2);
    queue.setTraffic('promotion');
    await vi.advanceTimersByTimeAsync(60000);
    const state = queue.snapshot();
    expect(state.orders).toHaveLength(DEFAULT_BATCH_SIZE);
    expect(state.producing).toBe(false);
    expect(state.draining).toBe(false);
    expect(state.waiting + state.processing).toBe(0);
    expect(snapshots.every((item) => item.waiting <= RULES.maxWaiting && item.processing <= RULES.concurrency)).toBe(
      true
    );
    expect(
      snapshots.every(
        (item) =>
          item.waiting +
            item.processing +
            item.orders.filter((order) => order.status === 'success' || order.status === 'failed').length ===
          item.orders.length
      )
    ).toBe(true);
    const starts = state.orders.map((order) => order.startedAt!);
    // 固定一秒窗口中最多启动两笔；区分启动速率与处理完成速率。
    const windows = new Map<number, number>();
    const origin = Math.min(...starts);
    for (const at of starts) {
      const window = Math.floor((at - origin) / RULES.interval);
      windows.set(window, (windows.get(window) ?? 0) + 1);
    }
    expect(Math.max(...windows.values())).toBeLessThanOrEqual(RULES.intervalCap);
  });

  test('暂停不打断运行任务，积压触发背压，加急任务优先出队', async () => {
    const queue = create();
    queue.setTraffic('promotion');
    queue.start();
    queue.togglePause();
    await vi.advanceTimersByTimeAsync(4000);
    const paused = queue.snapshot();
    expect(paused.orders[0].status).toBe('success');
    expect(paused.processing).toBe(0);
    expect(paused.waiting).toBe(RULES.maxWaiting);
    expect(paused.backpressure).toBe(true);
    const received = paused.orders.length;
    await vi.advanceTimersByTimeAsync(3000);
    expect(queue.snapshot().orders).toHaveLength(received);
    queue.togglePause();
    const active = queue.snapshot().orders.filter((order) => order.status === 'processing');
    expect(active.map((order) => order.id)).toEqual([5, 10]);
    await vi.advanceTimersByTimeAsync(12000);
    expect(queue.snapshot().orders.length).toBeGreaterThan(received);
  });

  test('从暂停状态停止接单并收尾，消费全部订单后发布最终快照', async () => {
    const snapshots: OrderQueueSnapshot[] = [];
    const queue = create((snapshot) => snapshots.push(snapshot));
    queue.setTraffic('promotion');
    queue.start();
    queue.togglePause();
    await vi.advanceTimersByTimeAsync(1000);
    const received = queue.snapshot().orders.length;
    queue.drain();
    expect(queue.snapshot().paused).toBe(false);
    await vi.advanceTimersByTimeAsync(20000);
    const state = queue.snapshot();
    expect(state.orders).toHaveLength(received);
    expect(state.producing || state.draining).toBe(false);
    expect(state.waiting + state.processing).toBe(0);
    expect(state.orders.every((order) => order.status === 'success' || order.status === 'failed')).toBe(true);
    expect(snapshots.at(-1)?.orders).toEqual(state.orders);
    expect(snapshots.at(-1)?.draining).toBe(false);
  });

  test('超时请求不会延迟成功；重试不重复创建订单，首次故障均可恢复', async () => {
    const queue = create();
    queue.setTraffic('promotion');
    queue.start();
    await vi.advanceTimersByTimeAsync(60000);
    const before = queue.snapshot();
    expect(before.orders.filter((order) => order.status === 'failed').map((order) => order.id)).toEqual([
      7, 11, 14, 21, 22, 28,
    ]);
    expect(before.orders.find((order) => order.id === 11)?.error).toContain('超时');
    await vi.advanceTimersByTimeAsync(6000);
    expect(queue.snapshot().orders.find((order) => order.id === 11)?.status).toBe('failed');
    queue.retryFailed();
    queue.retryFailed();
    await vi.advanceTimersByTimeAsync(15000);
    const after = queue.snapshot();
    expect(after.orders).toHaveLength(DEFAULT_BATCH_SIZE);
    expect(new Set(after.orders.map((order) => order.id)).size).toBe(DEFAULT_BATCH_SIZE);
    expect(after.orders.every((order) => order.status === 'success')).toBe(true);
    expect(after.orders.every((order) => order.attempt <= 2)).toBe(true);
    expect(after.activities.length).toBeLessThanOrEqual(40);
    expect(after.history.length).toBeLessThanOrEqual(40);
  });

  test('运行中销毁会取消正在执行与排队任务，旧实例不再更新页面', async () => {
    const onChange = vi.fn();
    const queue = create(onChange);
    queue.setTraffic('promotion');
    queue.start();
    await vi.advanceTimersByTimeAsync(1500);
    queue.dispose();
    const count = onChange.mock.calls.length;
    await vi.advanceTimersByTimeAsync(10000);
    expect(onChange).toHaveBeenCalledTimes(count);
    expect(vi.getTimerCount()).toBe(0);
    // 重置后的新实例，不继承旧队列或旧订单。
    const fresh = create();
    fresh.start();
    expect(fresh.snapshot().orders).toHaveLength(1);
    expect(fresh.snapshot().orders[0].id).toBe(1);
  });
});
