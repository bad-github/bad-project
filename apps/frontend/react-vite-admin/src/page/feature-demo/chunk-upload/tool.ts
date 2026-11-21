import {
  CONCURRENCY_NUM,
  EChunkStatus,
  type TAsyncFunction,
  type TAsyncFunctionMap,
  type TChunk,
  type TChunkResult,
  type TChunkStatus,
  type TTaskResult,
} from './types';

/**
 * 并发任务控制
 * @param tasks
 * @param concurrency
 * @returns
 */
export function parallelTask<T>(tasks: Array<() => Promise<T>>, concurrency = CONCURRENCY_NUM) {
  return new Promise((resolve) => {
    if (tasks.length === 0) {
      resolve([]);
      return;
    }
    const results: Array<T | unknown> = [];
    let nextIndex = 0;
    let finishedCount = 0;
    // (2)运行下一个任务
    async function _run() {
      const task = tasks[nextIndex];
      const taskIndex = nextIndex;
      nextIndex++;
      try {
        const res = await task();
        results[taskIndex] = res;
      } catch (err) {
        results[taskIndex] = err;
      } finally {
        finishedCount++;
        if (nextIndex < tasks.length) {
          // (3)还有任务执行下一个
          _run();
        } else if (finishedCount === tasks.length) {
          // (4)所有任务完成结束，并不是下一个任务完成才结束，因为任务都是异步的，不知道谁先完成
          console.warn('并发任务全部完成', finishedCount);
          resolve(results);
        }
      }
    }
    // (1)最开始时，根据数量启动并发任务
    for (let i = 0; i < concurrency && i < tasks.length; i++) {
      _run();
    }
  });
}

/**
 * 串行执行请求，成功才执行下一个
 * @param tasks
 * @returns
 */
export async function serialTask<T>(tasks: Array<() => Promise<T>>): Promise<T[] | undefined> {
  const results: T[] = [];
  for (const task of tasks) {
    try {
      const result = await task();
      results.push(result);
    } catch (_error) {
      return;
    }
  }
  return results;
}

export async function executeChunkPromise(promiseObj: TAsyncFunctionMap<TChunkResult>, concurrency = CONCURRENCY_NUM) {
  // 每个文件分片后，每个分片并行发起请求
  const promises: TAsyncFunction<TChunkResult>[] = [];
  Object.keys(promiseObj).forEach((key) => {
    promises.push(...promiseObj[key]);
  });
  // serialTask(promises);
  parallelTask(promises, concurrency);
}

/**
 * 计算文件hash
 * @param file
 * @returns
 */
export async function calcFileHash(file: File): Promise<string> {
  const now = Date.now();
  return new Promise((resolve) => {
    const worker = new Worker(new URL('./hash.worker', import.meta.url), {type: 'module'});
    worker.postMessage({file});
    worker.onmessage = (event: MessageEvent) => {
      const {hash} = event.data;
      if (hash) {
        const diff = Date.now() - now;
        console.warn(`计算${file.name}-hash耗时`, diff / 1000, '秒');
        resolve(hash);
        worker.terminate();
      }
    };
  });
}

export function buildFileKey(file: File) {
  return file.webkitRelativePath || file.name;
}

export function buildFileFields(file: File) {
  return {
    fileKey: buildFileKey(file),
    fileName: file.name,
    fileSize: file.size,
    filePath: file.webkitRelativePath, // 若是文件，此为空
  };
}

export function buildChunks(file: File, fileHash: string, chunkSize: number): TChunk[] {
  let current = 0;
  const chunks: TChunk[] = [];
  while (current < file.size) {
    chunks.push({
      ...buildFileFields(file),
      chunkSize,
      chunkFile: file.slice(current, current + chunkSize),
      fileHash,
    });
    current += chunkSize;
  }
  return chunks;
}

export function buildResponse(file: File, fileHash: string, chunks: TChunk[]): TChunkResult[] {
  return chunks.map((v) => ({
    ...buildFileFields(file),
    chunkStatus: EChunkStatus.NotUpload,
    chunkSize: v.chunkSize,
    fileHash, // 分片所属文件的hash
    chunkPercent: 0, // 每个分片的上传进度
  }));
}

export function buildChangeData(
  taskMap: Record<string, TTaskResult>,
  chunkMap: Record<string, TChunkResult[]>
): TTaskResult[] {
  const keys = Object.keys(chunkMap);
  /**
   * 分片状态=>总状态：状态设置按优先级顺序为如下
   * (1)某一个失败，则全部失败
   * (2)某一个暂停，则全部暂停
   * (3)某一个恢复中，则全部恢复中
   * (4)某一个上传中，则全部上传中
   * (5)某一个未上传，则全部未上传
   * (6)某一个成功，则全部成功
   */
  const statusPriority = {
    [EChunkStatus.Failed]: 1, // 优先级最高
    [EChunkStatus.Paused]: 2,
    [EChunkStatus.Uploading]: 4,
    [EChunkStatus.NotUpload]: 5,
    [EChunkStatus.Success]: 6,
  };
  for (const fileKey of keys) {
    const chunks = chunkMap[fileKey];
    // 默认优先级最低
    let totalChunkStatus: TChunkStatus = EChunkStatus.Success;
    let totalChunkPercent = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (!chunk) continue;
      // 所有分片合并后的进度
      totalChunkPercent += chunk.chunkPercent / chunks.length;
      // 和上一次的状态比较，取优先级最高的
      if (statusPriority[chunk.chunkStatus] < statusPriority[totalChunkStatus]) {
        totalChunkStatus = chunk.chunkStatus;
      }
      taskMap[fileKey] = {...taskMap[fileKey], totalChunkStatus, totalChunkPercent};
    }
  }
  return Object.values(taskMap);
}

export function sanitizeFolderFiles(fileList: FileList | File[]) {
  return Array.from(fileList).filter((file) => {
    const name = file.name;
    const path = file.webkitRelativePath || '';
    // 1. 过滤空目录（browser folder picker 会出现）
    if (file.size === 0 && !file.type) return false;
    // 2. 过滤隐藏文件（跨系统）
    if (name.startsWith('.')) return false;
    // 3. 过滤 Mac AppleDouble 文件
    if (name.startsWith('._')) return false;
    // 4. 过滤隐藏目录（例如 .git, .DS_Store, .Trash）
    const parts = path.split('/');
    if (parts.some((p) => p.startsWith('.'))) return false;
    // 5. Windows 隐藏文件
    if (name === 'Thumbs.db' || name === 'desktop.ini') return false;
    return true;
  });
}
