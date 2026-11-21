import {StorageKeys} from '../../../utils/storage-keys';
import {browser} from '@workspace/utils';

// 本例独占的 localStorage 键，与应用真正的登录 token 隔离。
export const DEMO_STORAGE_KEY = StorageKeys.externalStoreDemo;
// 同源页面使用同一个通道名，才能互相收发广播消息。
const CHANNEL_NAME = 'use-sync-external-store:messages';

type BrowserEnvironment = typeof window;
type BroadcastMessage = Readonly<{
  /** 最近收到的字符串消息；本页发出的消息不会回送给自身通道。 */
  text: string;
  /** 本页收到消息时的本地时间，仅用于展示，不是发送时间或消息唯一标识。 */
  receivedAt: string;
}>;

export type BrowserState = Readonly<{
  /** 浏览器布局视口尺寸，订阅启动及 resize 时同步；不是当前组件的尺寸。 */
  size: Readonly<{
    /** window.innerWidth，单位为 CSS 像素。 */
    width: number;
    /** window.innerHeight，单位为 CSS 像素。 */
    height: number;
  }>;
  /** navigator.onLine 的当前值，由 online / offline 事件同步；不保证目标服务可访问。 */
  online: boolean;
  /** 演示存储键对应的字符串；未设置或已移除时为 null，不是真实登录凭证。 */
  token: string | null;
  /** 最近一次 refresh 读取存储失败的提示；读取成功或成功同步存储后清空为 null。 */
  storageError: string | null;
  /** 最近收到的有效广播消息；尚未收到时为 null，收到相同内容也会产生新对象。 */
  broadcast: BroadcastMessage | null;
  /** 最近一次启动监听时，是否成功创建广播通道；未检测、无 API 或创建失败时为 false。 */
  broadcastSupported: boolean;
  /** location.search 的原始字符串，包含开头的 ?；没有参数时为 ''，读取时再解析。 */
  search: string;
  /** 当前 store 实例的快照版本；每次有效变化加 1，相同值写入不增加，不跨标签页同步。 */
  version: number;
}>;

// 服务端和客户端水合使用相同的初始快照。模块导入时不读取浏览器 API。
// 0 × 0、online: true 等都是确定的占位值，不代表已读取真实浏览器状态。
// 首次订阅后通过 startListening / refresh 同步；version 从 0 开始记录有效变化。
const INITIAL_STATE: BrowserState = Object.freeze({
  size: Object.freeze({width: 0, height: 0}),
  online: true,
  token: null,
  storageError: null,
  broadcast: null,
  broadcastSupported: false,
  search: '',
  version: 0,
});

export function createBrowserStore(
  environment: BrowserEnvironment | undefined = browser.canIUse('window') ? window : undefined
) {
  let state = INITIAL_STATE;
  const listeners = new Set<() => void>();
  let channel: BroadcastChannel | null = null;

  function setState(partial: Partial<Omit<BrowserState, 'version'>>) {
    const next = {...state, ...partial};
    // resize 每次会产生新对象，尺寸相同时复用旧引用。
    next.size =
      next.size.width === state.size.width && next.size.height === state.size.height
        ? state.size
        : Object.freeze({...next.size});
    const keys = Object.keys(partial) as (keyof typeof partial)[];
    if (keys.every((key) => Object.is(state[key], next[key]))) return;

    // 快照不可变；只有数据真的变化时才换引用并通知 React。
    state = Object.freeze({...next, version: state.version + 1});
    listeners.forEach((listener) => listener());
  }

  function refresh() {
    if (!environment) return;
    let token = state.token;
    let storageError: string | null = null;
    try {
      token = environment.localStorage.getItem(DEMO_STORAGE_KEY);
    } catch {
      storageError = '当前环境无法读取 localStorage';
    }
    setState({
      size: {width: environment.innerWidth, height: environment.innerHeight},
      online: environment.navigator.onLine,
      token,
      storageError,
      search: environment.location.search,
    });
  }

  const handleSize = () => {
    if (environment) setState({size: {width: environment.innerWidth, height: environment.innerHeight}});
  };
  const handleOnline = () => {
    if (environment) setState({online: environment.navigator.onLine});
  };
  const handleSearch = () => {
    if (environment) setState({search: environment.location.search});
  };
  const handleStorage = (event: StorageEvent) => {
    if (!environment || (event.key !== DEMO_STORAGE_KEY && event.key !== null)) return;
    // 忽略 sessionStorage；key 为 null 表示其他文档调用了 clear()。
    if (event.storageArea !== environment.localStorage) return;
    setState({token: event.key === null ? null : event.newValue, storageError: null});
  };
  const handleMessage = (event: MessageEvent<unknown>) => {
    if (typeof event.data !== 'string') return;
    // 接收到的每条消息都创建新快照，即使消息内容相同，也能表示一次新的接收。
    setState({broadcast: Object.freeze({text: event.data, receivedAt: new Date().toLocaleTimeString()})});
  };

  function startListening() {
    if (!environment) return;
    // 窗口尺寸变化时同步 innerWidth / innerHeight；尺寸相同不会生成新快照。
    environment.addEventListener('resize', handleSize);
    // 浏览器恢复为在线状态时触发；重新读取 navigator.onLine，不代表目标服务一定可访问。
    environment.addEventListener('online', handleOnline);
    // 浏览器变为离线状态时触发；与 online 共用处理函数，读取当前状态而非手动取反。
    environment.addEventListener('offline', handleOnline);
    // 其他同源文档修改共享存储时触发；处理函数只接受 localStorage 的演示键及 clear()。
    // 执行写入的当前文档不会收到该事件，需要在 setToken 中主动同步。
    environment.addEventListener('storage', handleStorage);
    // 前进、后退等操作切换历史记录时同步 URL；pushState / replaceState 本身不触发此事件。
    environment.addEventListener('popstate', handleSearch);
    // 返回本窗口并重新获得焦点时，重新读取浏览器状态，补偿失焦期间可能遗漏的变化。
    environment.addEventListener('focus', refresh);
    // 页面首次显示或从往返缓存（BFCache）恢复时触发；恢复后重新读取，避免展示冻结前的旧状态。
    // 它是文档级事件，React 路由切换不一定触发，因此订阅启动后仍需主动 refresh。
    environment.addEventListener('pageshow', refresh);

    try {
      // canIUse 仅检查 API 是否存在；即使存在，构造时仍可能失败，因此保留 try/catch。
      channel = browser.canIUse('BroadcastChannel', environment)
        ? new environment.BroadcastChannel(CHANNEL_NAME)
        : null;
      channel?.addEventListener('message', handleMessage);
    } catch {
      channel = null;
    }
    setState({broadcastSupported: channel !== null});
    // 先订阅再同步，保证离开页面后再次进入时不会沿用过时的浏览器状态。
    refresh();
  }

  function stopListening() {
    if (!environment) return;
    environment.removeEventListener('resize', handleSize);
    environment.removeEventListener('online', handleOnline);
    environment.removeEventListener('offline', handleOnline);
    environment.removeEventListener('storage', handleStorage);
    environment.removeEventListener('popstate', handleSearch);
    environment.removeEventListener('focus', refresh);
    environment.removeEventListener('pageshow', refresh);
    channel?.removeEventListener('message', handleMessage);
    channel?.close();
    channel = null;
  }

  return {
    getSnapshot: () => state,
    getServerSnapshot: () => INITIAL_STATE,
    subscribe(listener: () => void) {
      // 包装后每次订阅都有独立身份，即使调用方复用了同一个回调也能分别清理。
      const subscription = () => listener();
      listeners.add(subscription);
      // 多个组件共用一套浏览器监听，最后一个组件取消订阅时统一清理。
      if (listeners.size === 1) startListening();
      return () => {
        if (!listeners.delete(subscription)) return;
        if (listeners.size === 0) stopListening();
      };
    },
    refresh,
    setToken(token: string | null) {
      if (!environment) throw new Error('此操作需要浏览器环境');
      // 使用独立演示键，避免覆盖应用真实的登录 token。
      if (token === null) environment.localStorage.removeItem(DEMO_STORAGE_KEY);
      else environment.localStorage.setItem(DEMO_STORAGE_KEY, token);
      // storage 事件不会在执行写入的当前文档触发，必须主动更新本页快照。
      setState({token, storageError: null});
    },
    sendBroadcast(text: string) {
      if (!channel) throw new Error('当前环境不支持 BroadcastChannel，或页面尚未订阅');
      // 复用接收通道，不创建临时通道；发送者自身不会收到这条消息。
      channel.postMessage(text);
    },
    setQueryId(id: string) {
      if (!environment) throw new Error('此操作需要浏览器环境');
      const url = new URL(environment.location.href);
      if (id.trim()) url.searchParams.set('id', id.trim());
      else url.searchParams.delete('id');
      // 保留路由器的 history.state，不新增历史记录、不修改其他参数和 hash。
      environment.history.replaceState(environment.history.state, '', url);
      // replaceState / pushState 不会触发 popstate，主动写入后要显式同步。
      // 其他代码直接修改 History API 时也需要调用 refresh，或接入路由的订阅机制。
      handleSearch();
    },
  };
}

export const browserStore = createBrowserStore();
