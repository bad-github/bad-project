type RequestConfig = {
  url: string;
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT';
  data?: Record<string, any> | FormData;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  onUploadProgress?: (progressEvent: ProgressEvent) => void;
};

const buildQueryStr = (params: Record<string, any>): string => {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
};

const buildHeaders = (): Record<string, any> => {
  const headers = {
    baseURL: '',
    'Content-Type': 'application/json',
  };
  return headers;
};

const ajax = <T>(config: RequestConfig): Promise<T> => {
  const defaultHeaders = buildHeaders();
  return new Promise((resolve, reject) => {
    const {url, method, data, signal, onUploadProgress} = config;
    const headers = {...defaultHeaders, ...config.headers};
    let fullUrl = defaultHeaders.baseURL + url;
    const xhr = new XMLHttpRequest();
    if (['GET', 'DELETE'].includes(method)) {
      if (data && typeof data === 'object' && !(data instanceof FormData)) {
        const queryString = buildQueryStr(data);
        fullUrl = queryString ? `${url}?${queryString}` : url;
      }
    }
    xhr.open(method, fullUrl);
    if (headers) {
      // 文件上传时，删除默认type
      if (data instanceof FormData) {
        delete headers['Content-Type'];
      }
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
    }
    if (onUploadProgress) {
      // 上传进度
      xhr.upload.addEventListener('progress', onUploadProgress);
    }
    if (signal) {
      // 中断请求
      signal.addEventListener('abort', () => {
        xhr.abort();
        // new DOMException(message, name)
        reject(new DOMException('请求中断', 'AbortError'));
      });
    }
    xhr.addEventListener('error', () => {
      reject(new Error('网络错误'));
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // getResponseHeader() 获取响应头信息
        try {
          let response: T;
          if (['arraybuffer', 'blob'].includes(xhr.responseType)) {
            response = xhr.response as T;
          } else if (['', 'text'].includes(xhr.responseType)) {
            response = JSON.parse(xhr.responseText) as T;
          } else {
            response = xhr.response as T;
          }
          resolve(response);
        } catch (error) {
          console.error(error);
          reject(new Error('解析失败'));
        }
      } else {
        reject(new Error(`请求失败 ${xhr.status}: ${xhr.statusText}`));
      }
    });

    switch (method) {
      case 'GET':
      case 'DELETE':
        xhr.send();
        break;
      case 'POST':
      case 'PUT':
      case 'PATCH': {
        const body = data instanceof FormData ? data : typeof data === 'object' ? JSON.stringify(data) : data;
        xhr.send(body);
        break;
      }
    }
  });
};

export default ajax;
