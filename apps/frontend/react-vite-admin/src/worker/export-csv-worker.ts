/**
 * CSV 导出 Worker：
 * worker.postMessage({tableData, fetcherConfigs, dataConfig});
 * worker.postMessage({type: 'CANCEL'});
 * 成功返回 {buffer}，失败返回 {type: 'ERROR', message, buffer: null}。
 * 同时只执行一个任务；取消后不发送结果。
 * 类型请使用 import type 导入，避免在主线程执行本文件的 Worker 入口。
 */
export interface FetcherConfig {
  id: string;
  header: string;
  type: 'fn' | 'key' | 'default';
  /** fn 为 accessorFn.toString()；key 为点分路径；default 为直接字段名。 */
  value: string;
  /** 可选的列级参数，必须支持结构化克隆；未提供时，取值函数第二个参数使用 dataConfig。 */
  params?: unknown;
}

export interface WorkerPayload {
  tableData: Record<string, unknown>[];
  fetcherConfigs: FetcherConfig[];
  dataConfig: Record<string, unknown>;
}

export type CsvWorkerRequest = WorkerPayload | {type: 'CANCEL'};
export type CsvWorkerResponse = {buffer: ArrayBuffer} | {type: 'ERROR'; message: string; buffer: null};

// 项目使用 DOM 类型库，self 默认被推断成 Window；这里只声明实际使用的 Worker 消息端口签名。
const workerScope = self as unknown as {
  postMessage(message: CsvWorkerResponse, transfer?: Transferable[]): void;
};

type ExportTask = {cancelled: boolean};
type Accessor = (row: Record<string, unknown>, params: unknown, dataConfig: Record<string, unknown>) => unknown;
interface CompiledFetcher {
  header: string;
  fetchFn: (row: Record<string, unknown>) => unknown;
  preserveTimeText: boolean;
}

// 编码分块与调度时间片分别控制临时字符串大小和取消响应频率。
const BATCH_SIZE = 500;
const BATCH_CHARACTERS = 64 * 1024;
const TIME_SLICE_MS = 8;
const COPY_BLOCK_BYTES = 1024 * 1024;
let activeTask: ExportTask | undefined;

class ExportCancelledError extends Error {}

/** 时间列格式化入口，目前直接返回传入值。 */
function formatTime(_config: Record<string, unknown>, time: unknown): unknown {
  return time;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 让出 Worker 执行权，使消息队列能够处理取消请求。 */
async function yieldTask(): Promise<void> {
  const scheduler = (globalThis as typeof globalThis & {scheduler?: {yield?: () => Promise<void>}}).scheduler;
  if (typeof scheduler?.yield === 'function') {
    await scheduler.yield();
  } else {
    // 必须使用宏任务；微任务无法让消息事件执行。
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
}

/** 调度前后检查取消状态，防止遗漏让出期间收到的取消消息。 */
async function checkpoint(task: ExportTask): Promise<void> {
  if (task.cancelled) throw new ExportCancelledError();
  await yieldTask();
  if (task.cancelled) throw new ExportCancelledError();
}

/** 对包含逗号、CR、LF 或双引号的单元格加引号，并将内部双引号加倍。 */
function escapeCSV(value: unknown): string {
  const text = value == null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** 每列编译一次取值函数；函数调用签名为 accessor(row, params, dataConfig)。 */
function getCompiledFetchers(configs: unknown[], dataConfig: Record<string, unknown>): CompiledFetcher[] {
  return configs.map((config) => {
    if (
      !isRecord(config) ||
      typeof config.id !== 'string' ||
      typeof config.header !== 'string' ||
      typeof config.value !== 'string'
    ) {
      throw new Error('列配置必须包含字符串 id、header 和 value');
    }
    const {id, header, value} = config;
    let fetchFn: CompiledFetcher['fetchFn'];
    if (config.type === 'fn') {
      if (id === 'time') {
        fetchFn = (row) => formatTime(dataConfig, row.time);
      } else {
        const params = config.params === undefined ? dataConfig : config.params;
        try {
          /**
           * new Function 仅执行应用自身的列函数源码，并显式绑定 dataConfig、params。
           * 函数字符串不携带其他闭包或导入依赖；参数必须支持结构化克隆。
           * 例如 value: '(row, params) => row.price * params.rate'，params: {rate: 7.2}。
           */
          const accessor: unknown = new Function('dataConfig', 'params', `return (${value});`)(dataConfig, params);
          if (typeof accessor !== 'function') throw new Error('value 没有还原为函数');
          fetchFn = (row) => (accessor as Accessor)(row, params, dataConfig);
        } catch (error) {
          throw new Error(
            `列「${header}」的取值函数解析失败：${error instanceof Error ? error.message : String(error)}`,
            {cause: error}
          );
        }
      }
    } else if (config.type === 'key') {
      const paths = value.split('.');
      fetchFn = (row) => {
        let current: unknown = row;
        for (const path of paths) {
          current = current == null ? undefined : (current as Record<string, unknown>)[path];
        }
        return current;
      };
    } else if (config.type === 'default') {
      fetchFn = (row) => row[value] ?? ''; // 不能用 ||，否则 0 和 false 会丢失。
    } else {
      throw new Error(`列「${header}」的取值类型不支持：${String(config.type)}`);
    }
    // time 表头列追加零宽空格辅助 Excel 文本展示；该字符会改变实际数据。
    return {header, fetchFn, preserveTimeText: header.includes('time')};
  });
}

/** 合并编码块为可转移缓冲区，复制期间按时间片响应取消。 */
async function mergeChunks(
  chunks: (Uint8Array | undefined)[],
  totalBytes: number,
  task: ExportTask
): Promise<ArrayBuffer> {
  await checkpoint(task);
  // 分配完整输出时，编码块仍占用内存；峰值需容纳两者。
  const result = new Uint8Array(totalBytes);
  let offset = 0;
  let sliceStartedAt = performance.now();
  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index];
    if (!chunk) continue;
    // subarray 创建视图；每次最多复制 1 MiB，以便在大块复制之间检查取消。
    for (let start = 0; start < chunk.length; start += COPY_BLOCK_BYTES) {
      const part = chunk.subarray(start, start + COPY_BLOCK_BYTES);
      result.set(part, offset);
      offset += part.length;
      if (performance.now() - sliceStartedAt >= TIME_SLICE_MS) {
        await checkpoint(task);
        sliceStartedAt = performance.now();
      }
    }
    chunks[index] = undefined; // 断开已复制块的引用，供 GC 回收。
  }
  chunks.length = 0;
  await checkpoint(task); // 返回前处理最后一次复制期间到达的取消消息。
  return result.buffer;
}

/** 逐行取值、格式化并转义，分批编码为 UTF-8 后合并。 */
async function batchExportCSV(payload: WorkerPayload, task: ExportTask): Promise<ArrayBuffer> {
  const compiledFetchers = getCompiledFetchers(payload.fetcherConfigs, payload.dataConfig);
  const encoder = new TextEncoder();
  // UTF-8 BOM 帮助 Excel 识别中文编码。
  const chunks: (Uint8Array | undefined)[] = [new Uint8Array([0xef, 0xbb, 0xbf])];
  let totalBytes = 3;
  const append = (text: string) => {
    const chunk = encoder.encode(text);
    totalBytes += chunk.byteLength;
    chunks.push(chunk);
  };
  append(compiledFetchers.map((fetcher) => escapeCSV(fetcher.header)).join(',') + '\n');
  let rows: string[] = [];
  let characters = 0;
  await checkpoint(task);
  let sliceStartedAt = performance.now();
  for (let index = 0; index < payload.tableData.length; index++) {
    const row = payload.tableData[index];
    if (!isRecord(row)) throw new Error(`第 ${index + 1} 行必须是对象`);
    const cells = compiledFetchers.map((fetcher) => {
      try {
        let value = fetcher.fetchFn(row);
        // 不支持异步 accessor：否则 Promise 会被误序列化成 {}，造成静默错误。
        if (value !== null && typeof value === 'object' && 'then' in value && typeof value.then === 'function') {
          throw new Error('取值函数必须同步返回结果');
        }
        if (typeof value === 'object' && value !== null) value = JSON.stringify(value);
        let text = value == null ? '' : String(value);
        if (fetcher.preserveTimeText) text += '\u200B';
        return escapeCSV(text); // 格式化完成后只转义一次。
      } catch (error) {
        throw new Error(
          `第 ${index + 1} 行，列「${fetcher.header}」：${error instanceof Error ? error.message : String(error)}`,
          {cause: error}
        );
      }
    });
    const line = cells.join(',') + '\n';
    rows.push(line);
    characters += line.length;
    if (rows.length >= BATCH_SIZE || characters >= BATCH_CHARACTERS) {
      append(rows.join(''));
      rows = [];
      characters = 0;
    }
    // 每 32 行检查一次时间，减少计时开销；单次函数执行或 JSON 序列化本身无法中途取消。
    if ((index + 1) % 32 === 0 && performance.now() - sliceStartedAt >= TIME_SLICE_MS) {
      await checkpoint(task);
      sliceStartedAt = performance.now();
    }
  }
  if (rows.length) append(rows.join(''));
  return mergeChunks(chunks, totalBytes, task);
}

/** 接收导出或取消请求，统一处理任务状态和错误回复。 */
async function handleMessage(message: unknown): Promise<void> {
  if (isRecord(message) && message.type === 'CANCEL') {
    if (activeTask) activeTask.cancelled = true;
    return;
  }
  // 拒绝并发导出，防止结果和取消状态互相干扰。
  if (activeTask) {
    workerScope.postMessage({type: 'ERROR', message: '已有 CSV 导出任务正在执行', buffer: null});
    return;
  }
  const task: ExportTask = {cancelled: false};
  activeTask = task;
  try {
    if (
      !isRecord(message) ||
      !Array.isArray(message.tableData) ||
      !Array.isArray(message.fetcherConfigs) ||
      !isRecord(message.dataConfig)
    ) {
      throw new Error('需要 tableData 数组、fetcherConfigs 数组和 dataConfig 对象');
    }
    const buffer = await batchExportCSV(message as unknown as WorkerPayload, task);
    if (task.cancelled) throw new ExportCancelledError();
    // transfer list 转移缓冲区所有权，发送后 Worker 无法再访问其内容。
    workerScope.postMessage({buffer}, [buffer]);
  } catch (error) {
    if (error instanceof ExportCancelledError) {
      console.warn('CSV 导出任务已取消');
    } else {
      workerScope.postMessage({
        type: 'ERROR',
        message: error instanceof Error ? error.message : String(error),
        buffer: null,
      });
    }
  } finally {
    activeTask = undefined;
  }
}

self.addEventListener('message', (event: MessageEvent<unknown>) => {
  void handleMessage(event.data);
});
