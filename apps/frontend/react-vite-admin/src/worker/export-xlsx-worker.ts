import * as XLSX from 'xlsx';

/**
 * XLSX 导出 Worker：
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

export type XlsxWorkerRequest = WorkerPayload | {type: 'CANCEL'};
export type XlsxWorkerResponse = {buffer: ArrayBuffer} | {type: 'ERROR'; message: string; buffer: null};

// 项目使用 DOM 类型库，self 默认被推断成 Window；这里只声明实际使用的 Worker 消息端口签名。
const workerScope = self as unknown as {
  postMessage(message: XlsxWorkerResponse, transfer?: Transferable[]): void;
};

type ExportTask = {cancelled: boolean};
type Accessor = (row: Record<string, unknown>, params: unknown, dataConfig: Record<string, unknown>) => unknown;
interface CompiledFetcher {
  header: string;
  fetchFn: (row: Record<string, unknown>) => unknown;
}

// 分批写入限制临时行数组大小；时间片控制取消检查频率。
const BATCH_SIZE = 500;
const TIME_SLICE_MS = 8;
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
    return {header, fetchFn};
  });
}

type CellValue = string | number | boolean;

/** 保留数值和布尔单元格类型，对象转为 JSON，无法序列化时由调用方补充行列信息。 */
function toCellValue(value: unknown): CellValue {
  if (value == null) return '';
  if (typeof value === 'object') {
    if ('then' in value && typeof value.then === 'function') throw new Error('取值函数必须同步返回结果');
    return JSON.stringify(value) ?? '';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  throw new Error(`不支持的单元格类型：${typeof value}`);
}

/** 按列位置构建工作表，避免同名表头覆盖或数字表头重排列顺序。 */
async function batchExport(payload: WorkerPayload, task: ExportTask): Promise<ArrayBuffer> {
  const compiledFetchers = getCompiledFetchers(payload.fetcherConfigs, payload.dataConfig);
  await checkpoint(task);
  // 独立写入表头，空数据也有列名，首行从 A1 开始。
  const worksheet = XLSX.utils.aoa_to_sheet([compiledFetchers.map((fetcher) => fetcher.header)]);
  let currentBatch: CellValue[][] = [];
  let nextRow = 1; // SheetJS 行下标从 0 开始，数据从表头下一行写入。
  let sliceStartedAt = performance.now();

  for (let index = 0; index < payload.tableData.length; index++) {
    const row = payload.tableData[index];
    if (!isRecord(row)) throw new Error(`第 ${index + 1} 行必须是对象`);
    const cells = compiledFetchers.map((fetcher) => {
      try {
        return toCellValue(fetcher.fetchFn(row));
      } catch (error) {
        throw new Error(
          `第 ${index + 1} 行，列「${fetcher.header}」：${error instanceof Error ? error.message : String(error)}`,
          {cause: error}
        );
      }
    });
    currentBatch.push(cells);

    const shouldFlush = currentBatch.length >= BATCH_SIZE || index === payload.tableData.length - 1;
    if (shouldFlush) {
      XLSX.utils.sheet_add_aoa(worksheet, currentBatch, {origin: {r: nextRow, c: 0}});
      nextRow += currentBatch.length;
      currentBatch = [];
    }
    // 批次写入后及每 32 行检查时间；单次函数执行、序列化和写入无法中途取消。
    if ((shouldFlush || (index + 1) % 32 === 0) && performance.now() - sliceStartedAt >= TIME_SLICE_MS) {
      await checkpoint(task);
      sliceStartedAt = performance.now();
    }
  }

  // 工作表仍完整驻留内存，分批写入只减少临时行数组的占用。
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  await checkpoint(task);
  // write 同步完成序列化和压缩；立即中断需由主线程 terminate()，下次导出需重新创建 Worker。
  const buffer: unknown = XLSX.write(workbook, {type: 'array', bookType: 'xlsx', compression: true});
  await checkpoint(task); // 处理 write 期间排队的取消消息，阻止发送已取消的结果。
  if (!(buffer instanceof ArrayBuffer)) throw new Error('XLSX 输出不是 ArrayBuffer');
  return buffer;
}

/** 接收导出或取消请求，统一处理任务状态和错误回复。 */
async function handleMessage(message: unknown): Promise<void> {
  if (isRecord(message) && message.type === 'CANCEL') {
    if (activeTask) activeTask.cancelled = true;
    return;
  }
  // 拒绝并发导出，防止结果和取消状态互相干扰。
  if (activeTask) {
    workerScope.postMessage({type: 'ERROR', message: '已有 XLSX 导出任务正在执行', buffer: null});
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
    const buffer = await batchExport(message as unknown as WorkerPayload, task);
    if (task.cancelled) throw new ExportCancelledError();
    // transfer list 转移缓冲区所有权，发送后 Worker 无法再访问其内容。
    workerScope.postMessage({buffer}, [buffer]);
  } catch (error) {
    if (error instanceof ExportCancelledError) {
      console.warn('XLSX 导出任务已取消');
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
