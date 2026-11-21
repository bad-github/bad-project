import type {NormalizedError, ErrorLevel} from './types';

/** 将不同来源的异常整理成统一结构，方便展示、记录和上报。 */
export function normalizeError(error: any): NormalizedError {
  return {
    message: error?.message || String(error),
    stack: error?.stack,
    type: detectErrorType(error),
    raw: error,
  };
}

/**
 * 判断错误类型：
 * - chunk-load：动态导入的 JS 分包加载失败，常见于前端发布后旧页面仍引用旧文件。
 * - http：服务器已经响应，但 HTTP 状态码为 4xx 或 5xx。
 * - abort：请求被 AbortController 主动取消，不属于真正的系统异常。
 * - timeout：请求或操作超过规定时间。
 * - image-load / script-load：图片或普通 script 资源加载失败。
 * - network：断网、DNS、跨域或服务不可达等导致请求根本没有拿到 HTTP 响应。
 * - syntax：语法或 JSON 解析错误。
 * - type：对值进行了不允许的类型操作，例如读取 null 的属性。
 * - reference：访问了不存在的变量。
 * - range：数值超出允许范围，也可能由无限递归导致。
 * - uri：encodeURI/decodeURI 等处理了非法 URI。
 * - eval：eval 执行相关错误，现代浏览器中较少见。
 * - aggregate：多个异步错误被合并，例如 Promise.any 全部失败。
 * - runtime：不属于以上类型的普通运行时错误。
 */
export function detectErrorType(error: any): string {
  if (!error) return 'unknown';

  const message = typeof error === 'string' ? error : String(error.message ?? '');
  const name = typeof error === 'object' ? String(error.name ?? '') : '';
  const code = typeof error === 'object' ? String(error.code ?? '') : '';
  const status = Number(error?.status ?? error?.response?.status);

  // 分包错误通常表现为 TypeError，必须在普通 TypeError 之前判断。
  if (
    name === 'ChunkLoadError' ||
    /Loading chunk \d+ failed|Failed to fetch dynamically imported module|Importing a module script failed/i.test(message)
  ) {
    return 'chunk-load';
  }

  // 有合法错误状态码，说明请求已获得 HTTP 响应，不是网络错误。
  if (Number.isInteger(status) && status >= 400 && status <= 599) return 'http';

  if (name === 'AbortError' || code === 'ERR_CANCELED') return 'abort';

  // Fetch 的网络异常通常是 TypeError，因此同样要在普通 TypeError 之前判断。
  if (
    name === 'TimeoutError' ||
    code === 'ECONNABORTED' ||
    code === 'ETIMEDOUT' ||
    /timeout|timed out/i.test(message)
  ) {
    return 'timeout';
  }

  if (/^Image load failed:/i.test(message)) return 'image-load';
  if (/^Script load failed:/i.test(message)) return 'script-load';

  if (
    code === 'ERR_NETWORK' ||
    /Failed to fetch|NetworkError|Network request failed|Load failed/i.test(message)
  ) {
    return 'network';
  }

  if (error instanceof SyntaxError) return 'syntax';
  if (error instanceof TypeError) return 'type';
  if (error instanceof ReferenceError) return 'reference';
  if (error instanceof RangeError) return 'range';
  if (error instanceof URIError) return 'uri';
  if (error instanceof EvalError) return 'eval';
  if (error instanceof AggregateError) return 'aggregate';

  return 'runtime';
}

/**
 * 根据错误是否可恢复返回处理策略：
 * - ignore：忽略，不需要提示用户。
 * - recoverable：当前操作失败，但应用仍可继续使用，可提示用户重试。
 * - reload：当前资源版本可能已失效，需要刷新页面重新加载。
 * - fatal：程序逻辑或未知异常，无法在这里安全恢复。
 */
export function getErrorLevel(error: NormalizedError): ErrorLevel {
  switch (error.type) {
    case 'abort':
      return 'ignore';
    case 'chunk-load':
    case 'script-load':
      return 'reload';
    case 'http':
    case 'network':
    case 'timeout':
    case 'image-load':
      return 'recoverable';
    default:
      return 'fatal';
  }
}
