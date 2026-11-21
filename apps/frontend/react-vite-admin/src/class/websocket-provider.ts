// Adapted from https://github.com/joewalnes/reconnecting-websocket
//
// MIT License
//
// Copyright (c) 2010-2012 Joe Walnes
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/** WebSocketProvider 可配置项，与原 reconnecting-websocket 保持一致。 */
export interface WebSocketOptions {
  /** 是否输出当前实例的调试日志。 */
  debug?: boolean;
  /** 创建实例后是否立即连接。 */
  automaticOpen?: boolean;
  /** 首次重连的等待时间，单位毫秒。 */
  reconnectInterval?: number;
  /** 重连等待时间的最大值，单位毫秒。 */
  maxReconnectInterval?: number;
  /** 每次重连后等待时间的增长倍率。 */
  reconnectDecay?: number;
  /** 单次连接允许等待的最长时间，单位毫秒。 */
  timeoutInterval?: number;
  /** 最大重连次数；null 表示不限制。 */
  maxReconnectAttempts?: number | null;
  /** 二进制消息的接收类型。 */
  binaryType?: BinaryType;
}

/** open 是自定义事件，isReconnect 用于区分首次连接和重连。 */
type OpenEvent = CustomEvent & {
  isReconnect: boolean;
};

/**
 * connecting 是原库额外提供的事件。
 * 连接断开时，原始 CloseEvent 的信息会复制到该事件上。
 */
type ConnectingEvent = CustomEvent & {
  code?: number;
  reason?: string;
  wasClean?: boolean;
};

type EventMap = {
  open: OpenEvent;
  close: CloseEvent;
  connecting: ConnectingEvent;
  message: MessageEvent;
  error: CustomEvent;
};

type WebSocketProtocols = string | string[] | null;

/**
 * reconnecting-websocket 的 TypeScript class 改写版。
 *
 * 设计目标是保留原库行为，只替换实现形式：
 * - 原构造函数中的闭包变量改为 private 字段；
 * - 原来挂在 this 上的函数改为 class 方法；
 * - 原来借助 div 模拟 EventTarget，改为直接继承 EventTarget。
 */
export class WebSocketProvider extends EventTarget {
  /** 开启后，所有 WebSocketProvider 实例都会输出调试日志。 */
  static debugAll = false;

  /** 与原生 WebSocket 相同的四个状态常量。 */
  static readonly CONNECTING = WebSocket.CONNECTING;
  static readonly OPEN = WebSocket.OPEN;
  static readonly CLOSING = WebSocket.CLOSING;
  static readonly CLOSED = WebSocket.CLOSED;

  /** 连接地址。 */
  readonly url: string;

  /** 服务端最终选择的子协议；尚未连接成功时为 null。 */
  protocol: string | null = null;

  /** 自上次连接成功以来已经执行的重连次数。 */
  reconnectAttempts = 0;

  /** 当前连接状态，取值与原生 WebSocket.readyState 一致。 */
  readyState: number = WebSocket.CONNECTING;

  // 以下是原库的默认配置。它们保持公开，以便创建实例后继续修改。
  debug = false;
  automaticOpen = true;
  reconnectInterval = 1000;
  maxReconnectInterval = 30000;
  reconnectDecay = 1.5;
  timeoutInterval = 2000;
  maxReconnectAttempts: number | null = null;
  binaryType: BinaryType = 'blob';

  /** 当前实际工作的原生 WebSocket。 */
  private ws: WebSocket | null = null;

  /**
   * 暴露当前正在使用的原生 WebSocket，只允许读取引用，不能替换内部实例。
   * 连接尚未创建、正在等待重连或已经关闭时返回 null。
   */
  get nativeSocket(): WebSocket | null {
    return this.ws;
  }

  /** 构造原生 WebSocket 时使用的子协议。 */
  private readonly protocols: WebSocketProtocols;

  /** 标记是否由使用者主动调用 close，主动关闭后不再重连。 */
  private forcedClose = false;

  /** 标记当前连接是否因为连接超时而关闭。 */
  private timedOut = false;

  // 与原生 WebSocket 相同，允许外部直接赋值：provider.onmessage = handler。
  onopen(_event: OpenEvent) {}
  onclose(_event: CloseEvent) {}
  onconnecting(_event: ConnectingEvent) {}
  onmessage(_event: MessageEvent) {}
  onerror(_event: CustomEvent) {}

  /** 兼容项目原有用法：new WebSocketProvider(url, options)。 */
  constructor(url: string, options?: WebSocketOptions);

  /** 兼容原库用法：new ReconnectingWebSocket(url, protocols, options)。 */
  constructor(url: string, protocols?: WebSocketProtocols, options?: WebSocketOptions);

  constructor(
    url: string,
    protocolsOrOptions: WebSocketProtocols | WebSocketOptions = null,
    options: WebSocketOptions = {}
  ) {
    super();

    if (!('WebSocket' in window)) {
      throw new Error('WebSocket is not supported in this environment');
    }

    this.url = url;

    // 第二个参数是对象时，按项目原来的 (url, options) 形式处理；
    // 是字符串、数组或 null 时，按原库的 (url, protocols, options) 形式处理。
    const secondArgumentIsOptions =
      protocolsOrOptions !== null && typeof protocolsOrOptions === 'object' && !Array.isArray(protocolsOrOptions);

    this.protocols = secondArgumentIsOptions ? null : (protocolsOrOptions as WebSocketProtocols);
    Object.assign(this, secondArgumentIsOptions ? protocolsOrOptions : options);

    if (this.automaticOpen) {
      this.open(false);
    }
  }

  /**
   * 建立连接。
   * reconnectAttempt 仅供内部重连时传 true；手动调用时保持默认 false。
   */
  open(reconnectAttempt = false) {
    // 达到最大重试次数时终止。null 表示无限重试。
    if (reconnectAttempt && this.maxReconnectAttempts !== null && this.reconnectAttempts > this.maxReconnectAttempts) {
      return;
    }

    this.ws = new WebSocket(this.url, this.protocols ?? []);
    this.ws.binaryType = this.binaryType;

    if (!reconnectAttempt) {
      this.dispatch('connecting');
      this.reconnectAttempts = 0;
    }

    this.log('attempt-connect');

    // 保存本次创建的实例，连接超时时只关闭本次连接。
    const localWs = this.ws;
    const timeout = window.setTimeout(() => {
      this.log('connection-timeout');
      this.timedOut = true;
      localWs.close();
      this.timedOut = false;
    }, this.timeoutInterval);

    localWs.onopen = () => {
      clearTimeout(timeout);
      this.log('onopen');

      this.protocol = localWs.protocol;
      this.readyState = WebSocket.OPEN;
      this.reconnectAttempts = 0;

      // 原库直接在事件对象上提供 isReconnect，而不是放在 detail 中。
      this.dispatch('open', {isReconnect: reconnectAttempt});
      reconnectAttempt = false;
    };

    localWs.onclose = (event) => {
      clearTimeout(timeout);
      this.ws = null;

      if (this.forcedClose) {
        // 主动关闭：进入 CLOSED，只发 close，不再安排重连。
        this.readyState = WebSocket.CLOSED;
        this.dispatch('close');
        return;
      }

      // 意外断开：先进入 CONNECTING，并把关闭信息带给 connecting 事件。
      this.readyState = WebSocket.CONNECTING;
      this.dispatch('connecting', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });

      // 与原库一致：首次连接建立后发生的普通断开会额外发出 close。
      if (!reconnectAttempt && !this.timedOut) {
        this.log('onclose');
        this.dispatch('close');
      }

      // 指数退避：interval * decay^attempts，并受最大等待时间限制。
      const delay = Math.min(
        this.reconnectInterval * Math.pow(this.reconnectDecay, this.reconnectAttempts),
        this.maxReconnectInterval
      );

      window.setTimeout(() => {
        this.reconnectAttempts++;
        this.open(true);
      }, delay);
    };

    localWs.onmessage = (event) => {
      this.log('onmessage', event.data);

      // 原库创建 CustomEvent 后把 data 直接挂到事件对象上。
      this.dispatch('message', {data: event.data});
    };

    localWs.onerror = (event) => {
      this.log('onerror', event);
      this.dispatch('error');
    };
  }

  /** 向当前原生 WebSocket 发送数据。重连等待期间调用会抛出错误。 */
  send(data: string | ArrayBuffer | Blob) {
    if (!this.ws) {
      throw new Error('INVALID_STATE_ERR : Pausing to reconnect websocket');
    }

    this.log('send', data);
    return this.ws.send(data);
  }

  /** 主动关闭连接。forcedClose 会阻止 onclose 中的自动重连。 */
  close(code = 1000, reason?: string) {
    this.forcedClose = true;
    this.ws?.close(code, reason);
  }

  /**
   * 主动刷新连接。
   * 不设置 forcedClose，所以当前连接关闭后会按正常重连流程重新打开。
   */
  refresh() {
    this.ws?.close();
  }

  /**
   * 把 WebSocketProvider 内部发生的事情通知给外部，同时兼容两种监听方式：
   *
   * provider.addEventListener('message', handler)
   * provider.onmessage = handler
   *
   * 执行过程：
   * 1. createEvent 创建一个事件，并把 properties 中的数据直接挂到事件上；
   * 2. this.dispatchEvent(event) 通知 addEventListener 注册的监听器；
   * 3. 再根据 type 找到 onopen/onmessage 等属性并手动调用。
   *
   * 必须执行第 3 步，是因为 WebSocketProvider 只是继承了 EventTarget；
   * onmessage 等是本类定义的普通方法，不是浏览器内置的事件处理器属性，
   * EventTarget.dispatchEvent 不会自动调用它们。
   *
   * 当前实现中事件相关属性的真实值：
   * - event.type：传入的 type，例如 "open"、"message"；
   * - event.target：本 WebSocketProvider 实例，因为事件由 this.dispatchEvent 派发；
   * - event.currentTarget：addEventListener 回调执行期间是本实例，回调结束后恢复为 null；
   * - event.detail：null，因为 new CustomEvent(type) 时没有传入 detail；
   * - openEvent.isReconnect：properties 直接添加的字段，不在 event.detail 中；
   * - messageEvent.data：properties 直接添加的字段，不在 event.detail 中；
   * - connectingEvent.code/reason/wasClean：同样是直接添加的字段。
   *
   * 注意：event.target 不是内部原生 WebSocket（this.ws）。当前实现没有把
   * 原生 WebSocket 事件放进 detail；如果外部需要原始事件，需要另外传递。
   */
  private dispatch<K extends keyof EventMap>(type: K, properties?: Record<string, unknown>) {
    // 创建对外事件，例如 message -> CustomEvent，并附加 data 属性。
    const event = this.createEvent(type, properties);

    // 通知通过 addEventListener(type, handler) 注册的监听器。
    this.dispatchEvent(event);

    // 找到 onopen/onmessage 等方法；普通 EventTarget 不会替我们调用它。
    // 使用方括号访问而不是 Reflect.get，降低对运行环境 API 的要求。
    const handler = (this as unknown as Record<string, (event: EventMap[K]) => void>)['on' + type];
    handler.call(this, event);
  }

  /**
   * 创建一个 CustomEvent，并把业务字段直接复制到事件对象上。
   *
   * 例如 createEvent('message', {data: 'hello'}) 得到的结果是：
   * - event.type === 'message'
   * - event.data === 'hello'
   * - event.detail === null
   * - 派发前 event.target === null，dispatchEvent 后 target 指向本 Provider
   *
   * 这里沿用原库“数据直接挂在事件上”的行为。如果改成
   * new CustomEvent(type, {detail: properties})，外部就必须通过
   * event.detail.data 读取，这会改变原库的事件接口。
   */
  private createEvent<K extends keyof EventMap>(type: K, properties: Record<string, unknown> = {}): EventMap[K] {
    return Object.assign(new CustomEvent(type), properties) as unknown as EventMap[K];
  }

  private log(...args: unknown[]) {
    if (this.debug || WebSocketProvider.debugAll) {
      console.debug('WebSocketProvider', this.url, ...args);
    }
  }
}
