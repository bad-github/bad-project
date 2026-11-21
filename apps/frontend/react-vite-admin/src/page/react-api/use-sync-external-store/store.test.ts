import {afterEach, describe, expect, test, vi} from 'vitest';
import {createBrowserStore, DEMO_STORAGE_KEY} from './store';

// 用事件驱动的浏览器替身测试实际订阅生命周期，无需依赖 DOM 渲染环境。
class FakeBroadcastChannel extends EventTarget {
  static instances = new Set<FakeBroadcastChannel>();
  closed = false;
  readonly name: string;

  constructor(name: string) {
    super();
    this.name = name;
    FakeBroadcastChannel.instances.add(this);
  }

  postMessage(data: unknown) {
    if (this.closed) throw new Error('Channel is closed');
    for (const peer of FakeBroadcastChannel.instances) {
      if (peer !== this && peer.name === this.name) {
        peer.dispatchEvent(new MessageEvent('message', {data}));
      }
    }
  }

  close() {
    this.closed = true;
    FakeBroadcastChannel.instances.delete(this);
  }
}

function createEnvironment() {
  const target = new EventTarget();
  const values = new Map<string, string>();
  let url = new URL('https://example.test/demo?other=keep#article');
  const localStorage: Storage = {
    get length() {
      return values.size;
    },
    key: (index) => [...values.keys()][index] ?? null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
    clear: () => {
      values.clear();
    },
  };
  const historyState = {idx: 3, key: 'existing-router-state'};
  const raw = {
    innerWidth: 1200,
    innerHeight: 800,
    navigator: {onLine: true},
    localStorage,
    BroadcastChannel: FakeBroadcastChannel as typeof FakeBroadcastChannel | undefined,
    get location() {
      return url;
    },
    history: {
      state: historyState,
      replaceState: vi.fn((_state: unknown, _title: string, next: string | URL) => {
        url = new URL(next, url);
      }),
    },
    addEventListener: vi.fn((...args: Parameters<EventTarget['addEventListener']>) => target.addEventListener(...args)),
    removeEventListener: vi.fn((...args: Parameters<EventTarget['removeEventListener']>) =>
      target.removeEventListener(...args)
    ),
  };
  return {
    raw,
    environment: raw as unknown as typeof window,
    dispatch: (event: Event) => target.dispatchEvent(event),
    storageEvent(key: string | null, newValue: string | null, storageArea: Storage = localStorage) {
      const event = new Event('storage');
      Object.assign(event, {key, newValue, storageArea});
      target.dispatchEvent(event);
    },
  };
}

afterEach(() => {
  for (const channel of FakeBroadcastChannel.instances) channel.close();
});

describe('浏览器外部 store', () => {
  test('无浏览器时可安全读取固定的服务端快照', () => {
    const store = createBrowserStore();
    const snapshot = store.getServerSnapshot();
    expect(store.getSnapshot()).toBe(snapshot);
    expect(store.getServerSnapshot()).toBe(snapshot);
    const unsubscribe = store.subscribe(vi.fn());
    unsubscribe();
    expect(() => store.setToken('demo')).toThrow('浏览器环境');
  });

  test('相同值不通知；变化时生成不可变快照并保留旧快照', () => {
    const env = createEnvironment();
    const store = createBrowserStore(env.environment);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    const before = store.getSnapshot();
    listener.mockClear();

    store.refresh();
    store.setToken(null);
    env.dispatch(new Event('resize'));
    expect(store.getSnapshot()).toBe(before);
    expect(listener).not.toHaveBeenCalled();

    env.raw.innerWidth = 900;
    env.dispatch(new Event('resize'));
    const after = store.getSnapshot();
    expect(after.size.width).toBe(900);
    expect(before.size.width).toBe(1200);
    expect(after.version).toBe(before.version + 1);
    expect(Object.isFrozen(after)).toBe(true);
    expect(Object.isFrozen(after.size)).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  test('多个订阅共用监听和通道，最后取消时清理，重复取消无副作用', () => {
    const env = createEnvironment();
    const store = createBrowserStore(env.environment);
    const callback = vi.fn();
    const first = store.subscribe(callback);
    const second = store.subscribe(callback);
    expect(env.raw.addEventListener).toHaveBeenCalledTimes(7);
    expect(FakeBroadcastChannel.instances.size).toBe(1);
    first();
    expect(env.raw.removeEventListener).not.toHaveBeenCalled();
    second();
    expect(env.raw.removeEventListener).toHaveBeenCalledTimes(7);
    expect(FakeBroadcastChannel.instances.size).toBe(0);
    second();
    expect(env.raw.removeEventListener).toHaveBeenCalledTimes(7);
  });

  test('重新订阅时同步离开期间变化的浏览器状态', () => {
    const env = createEnvironment();
    const store = createBrowserStore(env.environment);
    store.subscribe(vi.fn())();
    env.raw.innerWidth = 640;
    env.raw.navigator.onLine = false;
    env.raw.localStorage.setItem(DEMO_STORAGE_KEY, 'changed-while-away');
    env.raw.history.replaceState(null, '', '?id=return');
    const unsubscribe = store.subscribe(vi.fn());
    expect(store.getSnapshot()).toMatchObject({
      size: {width: 640},
      online: false,
      token: 'changed-while-away',
      search: '?id=return',
    });
    unsubscribe();
  });

  test('当前文档主动同步存储，其他文档的更新和 clear 也可同步', () => {
    const env = createEnvironment();
    const store = createBrowserStore(env.environment);
    const unsubscribe = store.subscribe(vi.fn());
    store.setToken('local');
    expect(env.raw.localStorage.getItem(DEMO_STORAGE_KEY)).toBe('local');
    expect(env.raw.localStorage.getItem('token')).toBe(null);
    expect(store.getSnapshot().token).toBe('local');
    env.storageEvent(DEMO_STORAGE_KEY, 'remote');
    expect(store.getSnapshot().token).toBe('remote');
    const before = store.getSnapshot();
    env.storageEvent('unrelated', 'ignored');
    env.storageEvent(DEMO_STORAGE_KEY, 'session', {} as Storage);
    expect(store.getSnapshot()).toBe(before);
    env.storageEvent(null, null);
    expect(store.getSnapshot().token).toBeNull();
    unsubscribe();
  });

  test('广播仅其他通道接收，重复消息产生新快照，非法消息被忽略', () => {
    const sender = createBrowserStore(createEnvironment().environment);
    const receiver = createBrowserStore(createEnvironment().environment);
    const stopSender = sender.subscribe(vi.fn());
    const stopReceiver = receiver.subscribe(vi.fn());
    sender.sendBroadcast('hello');
    expect(sender.getSnapshot().broadcast).toBeNull();
    expect(receiver.getSnapshot().broadcast?.text).toBe('hello');
    const before = receiver.getSnapshot();
    sender.sendBroadcast('hello');
    expect(receiver.getSnapshot()).not.toBe(before);
    expect(Object.isFrozen(receiver.getSnapshot().broadcast)).toBe(true);
    const after = receiver.getSnapshot();
    const externalChannel = [...FakeBroadcastChannel.instances][0];
    externalChannel.postMessage({unexpected: true});
    expect(receiver.getSnapshot()).toBe(after);
    stopSender();
    stopReceiver();
    expect(() => sender.sendBroadcast('closed')).toThrow();
  });

  test('URL 更新保留其他参数、hash 和路由 state，popstate 同步外部变化', () => {
    const env = createEnvironment();
    const store = createBrowserStore(env.environment);
    const unsubscribe = store.subscribe(vi.fn());
    store.setQueryId(' demo 1 ');
    expect(env.raw.location.searchParams.get('id')).toBe('demo 1');
    expect(env.raw.location.searchParams.get('other')).toBe('keep');
    expect(env.raw.location.hash).toBe('#article');
    expect(env.raw.history.replaceState.mock.calls[0][0]).toBe(env.raw.history.state);
    expect(store.getSnapshot().search).toBe(env.raw.location.search);
    store.setQueryId('');
    expect(env.raw.location.searchParams.has('id')).toBe(false);
    env.raw.history.replaceState(null, '', '?id=back');
    env.dispatch(new Event('popstate'));
    expect(store.getSnapshot().search).toBe('?id=back');
    unsubscribe();
  });

  test('广播 API 存在但构造失败时，仍能正常订阅其他状态', () => {
    const env = createEnvironment();
    Object.defineProperty(env.raw, 'BroadcastChannel', {
      value: class {
        constructor() {
          throw new Error('Constructor denied');
        }
      },
    });
    const store = createBrowserStore(env.environment);
    const unsubscribe = store.subscribe(vi.fn());
    expect(store.getSnapshot().broadcastSupported).toBe(false);
    expect(store.getSnapshot().size.width).toBe(1200);
    unsubscribe();
  });

  test('存储受限或不支持广播时，其他浏览器订阅仍然工作', () => {
    const env = createEnvironment();
    env.raw.BroadcastChannel = undefined;
    Object.defineProperty(env.raw, 'localStorage', {
      get() {
        throw new Error('denied');
      },
    });
    const store = createBrowserStore(env.environment);
    const unsubscribe = store.subscribe(vi.fn());
    expect(store.getSnapshot().broadcastSupported).toBe(false);
    expect(store.getSnapshot().storageError).toBeTruthy();
    expect(store.getSnapshot().size.width).toBe(1200);
    expect(() => store.setToken('blocked')).toThrow('denied');
    expect(() => store.sendBroadcast('unsupported')).toThrow();
    unsubscribe();
  });
});
