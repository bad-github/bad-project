import type {UploadProgressOptions} from './types';
/**
 * 仅模拟上传进度，不发送请求，也不保存文件。
 * 发出初始进度并按时间递增，最后发出 total/total，再完成 Promise。
 * 中断时以 DOMException('Upload aborted', 'AbortError') 拒绝 Promise。
 * 上传成功/失败响应由调用方处理；进度完成不代表服务端处理成功。
 *
 * @returns 最后一次进度回调结束后完成；中断、参数无效或回调抛错时拒绝。
 * @example
 * await file.uploadProgress({total: selectedFile.size, signal: controller.signal, onProgress});
 */
async function uploadProgress({
  total,
  duration = 2000,
  interval = 100,
  initialLoaded = 0,
  signal,
  onProgress,
}: UploadProgressOptions): Promise<void> {
  // 字节数必须能精确表示，且起始值不能超过总大小；非法时间会造成错误调度。
  if (!Number.isSafeInteger(total) || total < 0) {
    throw new RangeError('total must be a non-negative safe integer');
  }
  if (!Number.isSafeInteger(initialLoaded) || initialLoaded < 0 || initialLoaded > total) {
    throw new RangeError('initialLoaded must be a safe integer between 0 and total');
  }
  if (!Number.isFinite(duration) || duration < 0) {
    throw new RangeError('duration must be a finite non-negative number');
  }
  if (!Number.isFinite(interval) || interval <= 0) {
    throw new RangeError('interval must be a finite positive number');
  }

  return new Promise<void>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    // 同时控制 Promise 收尾和后续调度，避免取消后继续上报进度。
    let settled = false;
    const start = performance.now();

    function cleanup() {
      // 成功、取消和异常共用清理逻辑，避免残留定时器或 abort 监听。
      clearTimeout(timer);
      signal?.removeEventListener('abort', handleAbort);
    }

    function fail(error: unknown) {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    }

    function handleAbort() {
      // 使用标准 AbortError，调用方可以区分主动暂停与普通失败。
      fail(new DOMException('Upload aborted', 'AbortError'));
    }

    function tick(initial = false) {
      if (settled) return;
      // 首次固定从 initialLoaded 开始；后续按实际经过时间计算，避免计时器延迟累积误差。
      const elapsed = initial ? 0 : performance.now() - start;
      const ratio = duration === 0 ? 1 : Math.min(1, elapsed / duration);
      // 仅递增剩余字节，向下取整保持整数；ratio 最大为 1，保证最终精确到 total。
      const loaded = initialLoaded + Math.floor((total - initialLoaded) * ratio);

      try {
        onProgress?.(new ProgressEvent('progress', {lengthComputable: true, loaded, total}));
      } catch (error) {
        // 业务回调异常也要停止任务并拒绝 Promise，避免异步定时器中的未捕获异常。
        fail(error);
        return;
      }

      // 回调中也可能触发 abort，不能再安排进度或完成 Promise。
      if (settled) return;
      if (loaded === total) {
        settled = true;
        cleanup();
        resolve();
      } else {
        // 临近结束时缩短等待，让 interval 大于 duration 时也能及时完成。
        timer = setTimeout(tick, Math.min(interval, Math.max(1, duration - elapsed)));
      }
    }

    // 已取消的信号不会再发出 abort 事件，需要在开始前检查。
    if (signal?.aborted) {
      handleAbort();
      return;
    }
    signal?.addEventListener('abort', handleAbort, {once: true});
    // 立即上报起始进度；duration 为 0、空文件或已经上传完成时，直接上报最终值。
    tick(true);
  });
}

/**
 * 判断文件大小是否在范围内
 * @param size 文件大小，单位byte
 * @param maxSize 最大文件大小，单位byte
 * @param minSize 最小文件大小，单位byte
 * @returns
 */
function isFileSizeInRange(size: number, maxSize: number, minSize = 0): boolean {
  return (
    [size, maxSize, minSize].every((value) => Number.isFinite(value) && value >= 0) &&
    minSize <= maxSize &&
    size >= minSize &&
    size <= maxSize
  );
}

/**
 * <1024B，显示B，否则显示KB
 * <1024KB，显示KB，否则显示MB
 * <1024MB，显示MB，否则显示GB
 * @param {number} bytes 文件大小，单位字节
 * @returns
 */
function formatByteSize(bytes: number) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  while (bytes >= 1024 && unitIndex < units.length - 1) {
    bytes /= 1024;
    unitIndex++;
  }
  return `${bytes.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * csv: {type: 'text/csv;charset=utf-8;'}
 * xlsx: {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
 * @returns
 */
const downloadFile = (buffer: BlobPart, filename: string, options?: BlobPropertyBag) => {
  const blob = new Blob([buffer], options);
  if (typeof window.URL?.createObjectURL === 'undefined') {
    console.error('当前浏览器不支持 URL.createObjectURL');
    return;
  }
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 200);
};

/** 文件上传、下载与大小处理。 */
export const file = {uploadProgress, isFileSizeInRange, formatByteSize, downloadFile};
