import PQueue from 'p-queue';
import {
  RULES,
  BATCH_SIZES,
  DEFAULT_BATCH_SIZE,
  TRAFFIC_PROFILES,
  orderLabel,
  type BatchSize,
  type Traffic,
  type Order,
  type Activity,
  type OrderQueueSnapshot,
} from './order-model';

export function emptySnapshot(options: {total?: BatchSize; traffic?: Traffic} = {}): OrderQueueSnapshot {
  return {
    orders: [],
    activities: [],
    history: [0],
    producing: false,
    draining: false,
    paused: false,
    backpressure: false,
    rateLimited: false,
    traffic: options.traffic ?? 'normal',
    total: options.total ?? DEFAULT_BATCH_SIZE,
    waiting: 0,
    processing: 0,
    now: Date.now(),
  };
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    const abort = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, ms);
    signal.addEventListener('abort', abort, {once: true});
  });
}

/** 每个页面实例独占队列，通过异步库存接口处理订单。 */
export function createOrderQueue(
  onChange: (snapshot: OrderQueueSnapshot) => void,
  options: {total?: BatchSize; traffic?: Traffic} = {}
) {
  const queue = new PQueue({
    concurrency: RULES.concurrency,
    intervalCap: RULES.intervalCap,
    interval: RULES.interval,
    timeout: RULES.timeout,
  });
  const orders: Order[] = [];
  const activities: Activity[] = [];
  const controllers = new Map<number, AbortController>();
  const tasks = new Set<Promise<void>>();
  const history = [0];
  let traffic: Traffic = options.traffic ?? 'normal';
  let total = options.total ?? DEFAULT_BATCH_SIZE;
  let producing = false;
  let draining = false;
  let backpressure = false;
  let disposed = false;
  let dirty = false;
  let eventId = 0;
  let ticks = 0;
  let producerTimer: ReturnType<typeof setTimeout> | undefined;

  function snapshot(): OrderQueueSnapshot {
    return {
      orders: orders.map((order) => ({...order})),
      activities: [...activities],
      history: [...history],
      producing,
      draining,
      paused: queue.isPaused,
      backpressure,
      rateLimited: queue.isRateLimited,
      traffic,
      total,
      waiting: queue.size,
      processing: queue.pending,
      now: Date.now(),
    };
  }
  function publish() {
    if (!disposed) {
      dirty = false;
      onChange(snapshot());
    }
  }
  function record(message: string, tone: Activity['tone'] = 'info') {
    dirty = true;
    activities.unshift({id: ++eventId, at: Date.now(), message, tone});
    activities.splice(40);
  }

  function enqueue(order: Order) {
    order.attempt++;
    order.status = 'waiting';
    order.queuedAt = Date.now();
    order.startedAt = null;
    order.finishedAt = null;
    order.error = '';
    order.stage = '等待分配工位';
    const controller = new AbortController();
    controllers.set(order.id, controller);
    // 首次处理固定注入故障，重试可恢复，便于重复观察和验证。
    const inventoryTimeout = order.id % 11 === 0 && order.attempt === 1;
    order.duration = inventoryTimeout ? 3500 : 1000 + (order.id % 4) * 350;
    const task = queue
      .add(
        async () => {
          order.status = 'processing';
          order.startedAt = Date.now();
          record(`${orderLabel(order.id)} 开始处理${order.urgent ? ' · 加急优先' : ''}`);
          for (const [stage, portion] of [
            ['校验订单', 0.15],
            ['锁定库存', 0.55],
            ['生成履约单', 0.3],
          ] as const) {
            controller.signal.throwIfAborted();
            order.stage = stage;
            await delay(order.duration * portion, controller.signal);
            controller.signal.throwIfAborted();
            if (stage === '锁定库存' && order.id % 7 === 0 && order.attempt === 1) {
              throw new Error('库存服务暂时不可用（503）');
            }
          }
        },
        {id: `${order.id}-${order.attempt}`, priority: order.urgent ? 10 : 0, signal: controller.signal}
      )
      .then(() => {
        if (disposed || controller.signal.aborted) return;
        order.status = 'success';
        order.stage = '履约单已生成';
        order.finishedAt = Date.now();
        record(`${orderLabel(order.id)} 履约成功`, 'success');
      })
      .catch((error: unknown) => {
        // p-queue 的超时会结束排队任务的等待，请求本身还需主动中止。
        controller.abort();
        if (disposed) return;
        order.status = 'failed';
        order.finishedAt = Date.now();
        order.error =
          error instanceof Error && error.name === 'TimeoutError'
            ? `库存接口超时（超过 ${RULES.timeout / 1000} 秒）`
            : error instanceof Error
              ? error.message
              : String(error);
        order.stage = '等待人工重试';
        record(`${orderLabel(order.id)} 处理失败 · ${order.error}`, 'warning');
      })
      .finally(() => {
        controllers.delete(order.id);
        tasks.delete(task);
      });
    tasks.add(task);
  }

  async function finish() {
    producing = false;
    backpressure = false;
    clearTimeout(producerTimer);
    draining = true;
    queue.start();
    record('已停止接单，继续处理全部已接收订单');
    publish();
    await queue.onIdle();
    // onIdle 只表示队列空闲；还要等 add() 的结果回调写入业务状态。
    await Promise.all([...tasks]);
    if (disposed) return;
    draining = false;
    record('本批次订单处理完成；失败订单可单独重试', 'success');
    publish();
  }

  function produce() {
    if (!producing || disposed) return;
    if (queue.size >= RULES.maxWaiting && !backpressure) {
      backpressure = true;
      record('等待队列已满，暂缓从上游拉取新订单', 'warning');
    }
    if (backpressure && queue.size <= RULES.lowWater) {
      backpressure = false;
      record('积压已回落，恢复接单');
    }
    if (!backpressure) {
      const id = orders.length + 1;
      const order: Order = {
        id,
        customer: ['陈女士', '林先生', '王女士', '李先生', '周女士'][id % 5],
        channel: ['商城', '小程序', '合作渠道'][id % 3],
        amount: 9900 + (id % 8) * 5000,
        urgent: id % 5 === 0,
        status: 'waiting',
        attempt: 0,
        receivedAt: Date.now(),
        queuedAt: Date.now(),
        startedAt: null,
        finishedAt: null,
        duration: 0,
        stage: '',
        error: '',
      };
      orders.push(order);
      record(`${orderLabel(id)} 已接入 · ${order.channel}${order.urgent ? ' · 加急订单' : ''}`);
      enqueue(order);
      if (orders.length === total) {
        void finish();
        return;
      }
    }
    producerTimer = setTimeout(produce, TRAFFIC_PROFILES[traffic].intervalMs);
  }

  // 业务事件先更新内存，每 200ms 统一给 React 一份快照，避免逐条消息触发渲染。
  const flushTimer = setInterval(() => {
    ticks++;
    if (ticks % 5 === 0) {
      history.push(queue.size);
      if (history.length > 40) history.shift();
    }
    if (dirty || producing || draining || queue.size > 0 || queue.pending > 0 || tasks.size > 0) publish();
  }, 200);

  return {
    snapshot,
    start() {
      if (disposed || producing || draining || orders.length >= total) return;
      producing = true;
      record('开始接收商城订单');
      produce();
      publish();
    },
    setTraffic(next: Traffic) {
      if (disposed || next === traffic) return;
      traffic = next;
      record(`上游流量已调整为${TRAFFIC_PROFILES[next].label}`);
      if (producing) {
        clearTimeout(producerTimer);
        producerTimer = setTimeout(produce, TRAFFIC_PROFILES[next].intervalMs);
      }
      publish();
    },
    setTotal(next: BatchSize) {
      if (disposed || producing || draining || orders.length || !BATCH_SIZES.includes(next)) return;
      total = next;
      publish();
    },
    togglePause() {
      if (disposed || draining) return;
      if (queue.isPaused) {
        queue.start();
        record('恢复处理，继续分配等待订单');
      } else {
        queue.pause();
        record('已暂停分配新任务；正在处理的订单继续执行', 'warning');
      }
      publish();
    },
    drain() {
      if (!disposed && !draining) void finish();
    },
    retryFailed() {
      if (disposed || draining) return;
      if (!orders.some((order) => order.status === 'failed')) return;
      let count = 0;
      for (const order of orders) {
        if (order.status !== 'failed' || queue.size >= RULES.maxWaiting) continue;
        enqueue(order);
        count++;
      }
      record(count ? `已将 ${count} 笔失败订单重新入队` : '等待队列已满，请稍后重试', count ? 'info' : 'warning');
      publish();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      clearTimeout(producerTimer);
      clearInterval(flushTimer);
      queue.pause();
      queue.removeAllListeners();
      // 先逐个取消，使每个 add() Promise 都能落定，再清空剩余队列。
      for (const controller of controllers.values()) controller.abort();
      controllers.clear();
      queue.clear();
    },
  };
}

export type OrderQueue = ReturnType<typeof createOrderQueue>;
