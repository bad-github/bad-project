import {useCallback, useSyncExternalStore} from 'react';
import {browserStore} from './store';
import type {BrowserState} from './store';

// selector 应返回基本类型，或快照中已有的稳定引用。
// 不要直接返回新建的对象 / 数组，否则 getSnapshot 每次读取都会得到不同引用。
// 本例只使用 React 默认的 Object.is 比较，不叠加自制浅比较和可变 ref 缓存。
export function useBrowserStore<T>(selector: (state: BrowserState) => T): T {
  const getSnapshot = useCallback(() => selector(browserStore.getSnapshot()), [selector]);
  const getServerSnapshot = useCallback(() => selector(browserStore.getServerSnapshot()), [selector]);

  return useSyncExternalStore(browserStore.subscribe, getSnapshot, getServerSnapshot);
}
