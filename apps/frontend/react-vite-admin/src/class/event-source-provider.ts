export interface EventSourceOptions {
  /** 是否输出当前实例的调试日志。 */
  debug?: boolean;
  /** 创建实例后是否立即连接。 */
  automaticOpen?: boolean;
  /** 跨域请求时是否携带 Cookie 等凭据。 */
  withCredentials?: boolean;
  /** 每次创建连接时附加到 URL 的查询参数。 */
  urlParams?: Record<string, any>;
  /** 首次重连的等待时间，单位毫秒。 */
  reconnectInterval?: number;
  /** 重连等待时间的最大值，单位毫秒。 */
  maxReconnectInterval?: number;
  /** 每次重连后等待时间的增长倍率。 */
  reconnectDecay?: number;
  /** 最大重连次数；null 表示不限制。 */
  maxReconnectAttempts?: number | null;
}

/** open 事件通过 isReconnect 区分首次连接和重连。 */
type OpenEvent = CustomEvent & {
  isReconnect: boolean;
};

/** error 事件保留原生 EventSource 触发的错误事件。 */
type ProviderErrorEvent = CustomEvent & {
  originalEvent: Event;
};

type EventMap = {
  open: OpenEvent;
  message: MessageEvent;
  error: ProviderErrorEvent;
  connecting: CustomEvent;
};

/**
 * 注意：在有些脚手架本地代理eventsource时，可能会收不到消息。vite不会
 * 原因：本地代理eventsource的请求响应头中包含：Content-Encoding: gzip。
 * SSE 是基于流的文本协议，而 gzip 是压缩后的二进制流，SSE 协议要求服务端发送的是 UTF-8 编码的纯文本，并保持连接不断开，实时推送数据。
 * Content-Encoding: gzip 会把响应内容变成压缩格式（即二进制数据），这会破坏SSE数据格式
 * 建议设置以下响应头
 *    res.setHeader('Content-Type', 'text/event-stream')
 *    res.setHeader('Cache-Control', 'no-cache')
 *    res.setHeader('Connection', 'keep-alive')
 *    res.setHeader('Content-Encoding', 'identity'); // 禁止压缩
 *
 */

export class EventSourceProvider extends EventTarget {
  /** 开启后，所有 EventSourceProvider 实例都会输出调试日志。 */
  static debugAll = false;
  static readonly CONNECTING = EventSource.CONNECTING;
  static readonly OPEN = EventSource.OPEN;
  static readonly CLOSED = EventSource.CLOSED;

  // readonly
  readonly baseUrl: string;
  reconnectAttempts = 0;
  readyState: number = EventSource.CONNECTING;

  // options
  debug = false;
  automaticOpen = true;
  withCredentials = true;
  urlParams: Record<string, any> = {};
  reconnectInterval = 1000;
  maxReconnectInterval = 30000;
  reconnectDecay = 1.5;
  maxReconnectAttempts: number | null = null;

  // private
  private es: EventSource | null = null;

  /**
   * 暴露当前正在使用的原生 EventSource，只允许读取引用，不能替换内部实例。
   * 连接尚未创建、正在等待重连或已经关闭时返回 null。
   */
  get nativeEventSource(): EventSource | null {
    return this.es;
  }

  private forcedClose = false;

  // 与原生 EventSource 相同，允许外部直接赋值：provider.onmessage = handler。
  onopen(_: OpenEvent) {}
  onmessage(_: MessageEvent) {}
  onerror(_: ProviderErrorEvent) {}
  onconnecting(_: CustomEvent) {}

  // 实例方法是close

  constructor(baseUrl: string, options: EventSourceOptions = {}) {
    super();

    if (!('EventSource' in window)) {
      throw new Error('EventSource is not supported in this environment');
    }

    this.baseUrl = baseUrl;
    Object.assign(this, options);

    if (this.automaticOpen) {
      this.open(false);
    }
  }

  private buildUrl(): string {
    const query = new URLSearchParams(this.urlParams).toString();
    const fullPath = `${this.baseUrl}`;
    return query ? `${fullPath}?${query}` : fullPath;
  }

  /**
   * 建立 SSE 连接。
   * reconnectAttempt 仅供内部重连时传 true；手动调用时保持默认 false。
   */
  open(reconnectAttempt = false) {
    if (reconnectAttempt && this.maxReconnectAttempts !== null && this.reconnectAttempts > this.maxReconnectAttempts) {
      this.log('max-reconnect-attempts-reached');
      return;
    }

    this.forcedClose = false;
    this.disconnectInstance(); // 确保清理旧实例

    this.log('attempt-connect');
    this.readyState = EventSource.CONNECTING;

    if (!reconnectAttempt) {
      this.dispatch('connecting');
      this.reconnectAttempts = 0;
    }

    this.es = new EventSource(this.buildUrl(), {
      withCredentials: this.withCredentials,
    });

    const localEs = this.es;

    localEs.onopen = (_event) => {
      this.log('onopen');
      this.readyState = EventSource.OPEN;
      this.reconnectAttempts = 0;
      this.dispatch('open', {isReconnect: reconnectAttempt});
    };

    localEs.onmessage = (event) => {
      this.log('onmessage', event.data);

      // 与 WebSocketProvider 一致：字段直接挂在事件上，不放进 detail。
      this.dispatch('message', {
        data: event.data,
        lastEventId: event.lastEventId,
        origin: event.origin,
      });
    };

    localEs.onerror = (event) => {
      this.log('onerror', event);
      this.dispatch('error', {originalEvent: event});

      // EventSource 内部会自动重连，但为了实现指数退避和最大重试控制
      // 我们显式关闭它并手动触发逻辑
      this.disconnectInstance();

      if (this.forcedClose) {
        this.readyState = EventSource.CLOSED;
        return;
      }

      this.readyState = EventSource.CONNECTING;
      this.dispatch('connecting');

      const delay = Math.min(
        this.reconnectInterval * Math.pow(this.reconnectDecay, this.reconnectAttempts),
        this.maxReconnectInterval
      );

      setTimeout(() => {
        this.reconnectAttempts++;
        this.open(true);
      }, delay);
    };
  }

  close() {
    this.forcedClose = true;
    this.disconnectInstance();
    this.readyState = EventSource.CLOSED;
  }

  private disconnectInstance() {
    if (this.es) {
      this.es.close();
      this.es = null;
    }
  }

  /**
   * 把 EventSourceProvider 内部事件通知给外部，同时兼容两种监听方式：
   *
   * provider.addEventListener('message', handler)
   * provider.onmessage = handler
   *
   * 执行过程：
   * 1. createEvent 创建事件，并把 properties 中的数据直接挂到事件上；
   * 2. dispatchEvent 通知 addEventListener 注册的监听器；
   * 3. 再手动调用 onopen/onmessage 等普通方法。
   *
   * 事件派发后：
   * - event.target 是本 EventSourceProvider，不是内部原生 EventSource；
   * - event.detail 是 null；
   * - message 的 data/lastEventId/origin 是事件的直接属性；
   * - open 的 isReconnect 是事件的直接属性；
   * - error 的 originalEvent 是原生 EventSource 错误事件。
   */
  private dispatch<K extends keyof EventMap>(type: K, properties?: Record<string, unknown>) {
    const event = this.createEvent(type, properties);

    // 通知通过 addEventListener(type, handler) 注册的监听器。
    this.dispatchEvent(event);

    // 普通 EventTarget 不会自动调用本类声明的 onmessage/onopen 等方法。
    const handler = (this as unknown as Record<string, (event: EventMap[K]) => void>)['on' + type];
    handler.call(this, event);
  }

  /**
   * 创建 CustomEvent，并把业务字段直接复制到事件对象上。
   * 这样外部继续通过 event.data 读取消息，而不是 event.detail.data。
   */
  private createEvent<K extends keyof EventMap>(type: K, properties: Record<string, unknown> = {}): EventMap[K] {
    return Object.assign(new CustomEvent(type), properties) as unknown as EventMap[K];
  }

  private log(...args: unknown[]) {
    if (this.debug || EventSourceProvider.debugAll) {
      console.debug('EventSourceProvider', this.baseUrl, ...args);
    }
  }
}
