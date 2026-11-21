/**
 * 接收主线程转发的 WebSocket/SSE 数据包，依次排队、解析、转换过滤和批量消费。
 * dataString 为 JSON 字符串数组的序列化结果，每个数组元素再解析成一行对象。
 * 输出 BATCH_SAVE（批次条数）、RESUME（原始队列已消费完）和 OVERLOAD（拒收当前包）。
 */
export interface WorkerPayload {
  type: string;
  /** 过滤条件预留，目前所有行均通过。 */
  query: unknown;
  dataString: string;
  /** 页面数据回收参数预留，目前不参与处理。 */
  oldestRenderId: number | null;
}

export type TransformWorkerRequest = WorkerPayload | {type: 'CANCEL'};
export type TransformWorkerResponse = {type: 'BATCH_SAVE'; length: number} | {type: 'RESUME'} | {type: 'OVERLOAD'};

type Row = Record<string, unknown>;
type Predicate = (row: Row) => boolean;
type RawTask = {dataString: string; predicate: Predicate};
interface ProcessingState {
  controller: AbortController;
  rawDataQueue: (RawTask | undefined)[];
  buffer: Row[];
  head: number;
  isConsuming: boolean;
  isFlushing: boolean;
  flushTimer: ReturnType<typeof setTimeout> | undefined;
}

const MAX_QUEUE_SIZE = 100;
const MAX_BATCH_SIZE = 800;
const HIGH_WATER_MARK = 2000;
const THROTTLE_DELAY_MS = 100;
const FLUSH_DELAY_MS = 200;
const TIME_SLICE_MS = 8;
const acceptAllRows: Predicate = () => true;
const workerScope = self as unknown as {postMessage(message: TransformWorkerResponse): void};
let state = createState();

/** 每次取消后使用独立状态，挂起中的消费者只能访问自己所属的数据和标志。 */
function createState(): ProcessingState {
  return {
    controller: new AbortController(),
    rawDataQueue: [],
    buffer: [],
    head: 0,
    isConsuming: false,
    isFlushing: false,
    flushTimer: undefined,
  };
}

function isRecord(value: unknown): value is Row {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 限速等待可被取消唤醒，并清理定时器和监听器，避免取消后仍保留整包数据。 */
function waitTask(current: ProcessingState, delay: number): Promise<void> {
  const signal = current.controller.signal;
  if (signal.aborted) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', finish);
      resolve();
    };
    const timer = setTimeout(finish, delay);
    signal.addEventListener('abort', finish, {once: true});
  });
}

/** 计算时间片用快速调度，积压限速仍使用 100ms 等待；微任务不能让消息事件执行。 */
async function yieldTask(current: ProcessingState): Promise<void> {
  if (current.controller.signal.aborted) return;
  const scheduler = (globalThis as typeof globalThis & {scheduler?: {yield?: () => Promise<void>}}).scheduler;
  if (typeof scheduler?.yield === 'function') {
    await scheduler.yield();
  } else {
    await waitTask(current, 0);
  }
}

/** 串行消费缓冲区，每批最多 800 行；批次间有积压时让出执行权。 */
async function performFlush(current: ProcessingState): Promise<void> {
  if (current.controller.signal.aborted || current.isFlushing || current.buffer.length === 0) return;
  current.isFlushing = true;
  if (current.flushTimer !== undefined) {
    clearTimeout(current.flushTimer);
    current.flushTimer = undefined;
  }
  try {
    while (!current.controller.signal.aborted && current.buffer.length > 0) {
      const dataToSave = current.buffer.splice(0, MAX_BATCH_SIZE);
      try {
        // 持久化接入点：await db.batchSave(dataToSave)。目前仅通知条数，不保存或回传行数据。
        workerScope.postMessage({type: 'BATCH_SAVE', length: dataToSave.length});
      } catch (error) {
        console.error('Worker DB Save Error:', error);
      } finally {
        dataToSave.length = 0;
      }
      if (current.buffer.length > 0) await yieldTask(current);
    }
  } catch (error) {
    console.error('Worker flush error:', error);
  } finally {
    current.isFlushing = false;
    if (!current.controller.signal.aborted && current.buffer.length > 0) checkAndFlush(current);
  }
}

/** 满批立即消费，未满批在首次积累数据后的 200ms 触发。 */
function checkAndFlush(current: ProcessingState): void {
  if (current.controller.signal.aborted || current.isFlushing || current.buffer.length === 0) return;
  if (current.buffer.length >= MAX_BATCH_SIZE) {
    void performFlush(current);
  } else if (current.flushTimer === undefined) {
    current.flushTimer = setTimeout(() => {
      current.flushTimer = undefined;
      void performFlush(current);
    }, FLUSH_DELAY_MS);
  }
}

/** 行转换入口，当前浅拷贝数据；可在此裁剪页面不需要的字段或扁平化。 */
function buildRow(data: Row): Row {
  return {...data};
}

/** 逐行容错，已处理字符串及时释放；规则固定在当前数据包内。 */
async function processRawData(current: ProcessingState, dataArray: unknown[], predicate: Predicate): Promise<void> {
  let processCount = 0;
  let sliceStartedAt = performance.now();
  try {
    for (let index = 0; index < dataArray.length; index++) {
      if (current.controller.signal.aborted) return;
      if (++processCount > MAX_BATCH_SIZE) {
        processCount = 0;
        await waitTask(current, THROTTLE_DELAY_MS);
        if (current.controller.signal.aborted) return;
        sliceStartedAt = performance.now();
      }
      // 等待缓冲区下降后再继续解析，避免仅等待一次就继续堆积。
      while (current.buffer.length > HIGH_WATER_MARK) {
        await waitTask(current, THROTTLE_DELAY_MS);
        if (current.controller.signal.aborted) return;
      }
      if (index % 32 === 0 && performance.now() - sliceStartedAt >= TIME_SLICE_MS) {
        await yieldTask(current);
        if (current.controller.signal.aborted) return;
        sliceStartedAt = performance.now();
      }
      const rawString = dataArray[index];
      dataArray[index] = undefined;
      if (rawString === '' || rawString == null) continue;
      try {
        if (typeof rawString !== 'string') throw new Error('行数据必须是 JSON 字符串');
        const data: unknown = JSON.parse(rawString);
        if (!isRecord(data)) throw new Error('行数据解析结果必须是对象');
        const entity = buildRow(data);
        if (predicate(entity)) {
          current.buffer.push(entity);
          checkAndFlush(current);
        }
      } catch (error) {
        console.error(`Error processRawData, row ${index + 1}:`, error);
      }
    }
  } finally {
    dataArray.length = 0;
  }
}

/** 单消费者处理原始数据包，槽位无论有效或异常都推进，避免空槽死循环。 */
async function startConsuming(current: ProcessingState): Promise<void> {
  if (current.controller.signal.aborted || current.isConsuming) return;
  current.isConsuming = true;
  try {
    while (!current.controller.signal.aborted && current.head < current.rawDataQueue.length) {
      if (current.buffer.length > HIGH_WATER_MARK) {
        await waitTask(current, THROTTLE_DELAY_MS);
        continue;
      }
      if (current.rawDataQueue.length - current.head > MAX_QUEUE_SIZE) {
        await waitTask(current, THROTTLE_DELAY_MS);
        if (current.controller.signal.aborted) return;
      }
      const taskIndex = current.head;
      const task = current.rawDataQueue[taskIndex];
      current.rawDataQueue[taskIndex] = undefined;
      try {
        if (task) {
          const dataArray: unknown = JSON.parse(task.dataString);
          task.dataString = '';
          if (!Array.isArray(dataArray)) throw new Error('数据包解析结果必须是数组');
          await processRawData(current, dataArray, task.predicate);
        }
      } catch (error) {
        console.error('Batch process error:', error);
      } finally {
        if (task) task.dataString = '';
        current.head = taskIndex + 1;
      }
      if (current.controller.signal.aborted) return;
      if (current.head >= 10 || current.head === current.rawDataQueue.length) {
        current.rawDataQueue.splice(0, current.head);
        current.head = 0;
        if (current.rawDataQueue.length > 0) await waitTask(current, THROTTLE_DELAY_MS);
      }
    }
    if (!current.controller.signal.aborted) {
      // 只表示原始队列处理完；未满批的缓冲数据可能仍在等待定时消费。
      workerScope.postMessage({type: 'RESUME'});
    }
  } catch (error) {
    console.error('Worker consume error:', error);
  } finally {
    current.isConsuming = false;
  }
}

/** 取消同时清理消费定时器，并唤醒正在限速等待的任务。 */
function cancel(current: ProcessingState): void {
  current.controller.abort();
  if (current.flushTimer !== undefined) {
    clearTimeout(current.flushTimer);
    current.flushTimer = undefined;
  }
  current.rawDataQueue.length = 0;
  current.buffer.length = 0;
}

function handleMessage(message: unknown): void {
  if (!isRecord(message)) return;
  if (message.type === 'CANCEL') {
    cancel(state);
    state = createState();
    console.warn('Worker 被停止');
    return;
  }
  if (typeof message.dataString !== 'string') {
    console.error('Parse incoming data error: dataString 必须是字符串');
    return;
  }
  if (state.rawDataQueue.length - state.head > MAX_QUEUE_SIZE + 50) {
    workerScope.postMessage({type: 'OVERLOAD'});
    console.warn('Worker 任务积压严重，正在跳过数据包以保护内存');
    return;
  }
  // query 的过滤编译接入点；每包持有自己的规则，处理中不会被后续消息替换。
  state.rawDataQueue.push({dataString: message.dataString, predicate: acceptAllRows});
  void startConsuming(state);
}

self.addEventListener('message', (event: MessageEvent<unknown>) => {
  handleMessage(event.data);
});
