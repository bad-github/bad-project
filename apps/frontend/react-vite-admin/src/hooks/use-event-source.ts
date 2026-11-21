import {useCallback, useEffect, useLayoutEffect, useMemo, useRef} from 'react';

import {type EventSourceOptions, EventSourceProvider} from '@/class/event-source-provider';

interface UseEventSourceOptions {
  /** 是否在 URL 存在时自动连接，默认 true。 */
  autoConnect?: boolean;

  /** 传给 EventSourceProvider 的配置。 */
  providerOptions?: Omit<EventSourceOptions, 'automaticOpen'>;

  onOpen?: (event: CustomEvent) => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: CustomEvent) => void;
  onConnecting?: (event: CustomEvent) => void;
}

export default function useEventSource(url: string | null | undefined, options: UseEventSourceOptions = {}) {
  const instanceRef = useRef<EventSourceProvider | null>(null);
  const urlRef = useRef(url);
  const optionsRef = useRef(options);

  // 表示当前是否希望保持连接。
  // 页面隐藏只是暂时断开，不会修改该状态。
  const shouldConnectRef = useRef(false);

  useLayoutEffect(() => {
    urlRef.current = url;
    optionsRef.current = options;
  }, [url, options]);

  /** 只关闭实例，不修改连接意图。 */
  const closeCurrentInstance = useCallback(() => {
    instanceRef.current?.close();
    instanceRef.current = null;
  }, []);

  /** 主动断开；页面重新显示时也不会自动恢复。 */
  const disconnect = useCallback(() => {
    shouldConnectRef.current = false;
    closeCurrentInstance();
  }, [closeCurrentInstance]);

  /**
   * 主动连接。
   *
   * 页面隐藏时仅记录连接意图，等页面恢复可见后再真正建立连接。
   */
  const connect = useCallback(() => {
    shouldConnectRef.current = true;
    closeCurrentInstance();

    const currentUrl = urlRef.current;

    if (!currentUrl || document.hidden) {
      return null;
    }

    const currentOptions = optionsRef.current;

    // Hook 统一管理生命周期，因此禁用 Provider 构造阶段的自动连接。
    const instance = new EventSourceProvider(currentUrl, {
      ...currentOptions.providerOptions,
      automaticOpen: false,
    });
    // 回调中读取 optionsRef，始终使用最新的外部回调。
    instance.onopen = (event) => {
      optionsRef.current.onOpen?.(event);
    };

    instance.onmessage = (event) => {
      optionsRef.current.onMessage?.(event);
    };

    instance.onerror = (event) => {
      optionsRef.current.onError?.(event);
    };

    instance.onconnecting = (event) => {
      optionsRef.current.onConnecting?.(event);
    };

    // 必须先保存实例，因为 open() 会同步触发 connecting。
    instanceRef.current = instance;
    instance.open();

    return instance;
  }, [closeCurrentInstance]);

  const autoConnect = options.autoConnect;

  // 处理首次连接、URL 变化以及 autoConnect 变化。
  useEffect(() => {
    if (autoConnect && url) {
      connect();
    } else {
      disconnect();
    }
  }, [url, autoConnect, connect, disconnect]);

  // 页面隐藏时暂时断开，重新显示后根据连接意图恢复。
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        closeCurrentInstance();
        return;
      }

      if (shouldConnectRef.current) {
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connect, closeCurrentInstance]);

  // 组件卸载时彻底断开。
  useEffect(() => {
    return disconnect;
  }, [disconnect]);

  return useMemo(
    () => ({
      /** 当前 Provider 实例；不会触发 React 重新渲染。 */
      get instance() {
        return instanceRef.current;
      },

      connect,
      disconnect,
    }),
    [connect, disconnect]
  );
}
