import {useEffect, useRef, useCallback, useLayoutEffect} from 'react';
import {type WebSocketOptions, WebSocketProvider} from '@/class/websocket-provider';

export default function useWebSocket(
  url: string | null | undefined,
  options: WebSocketOptions & {
    onMessage?: (event: MessageEvent) => void;
    onOpen?: (event: Event) => void;
    onConnecting?: (event: Event) => void;
    onClose?: (event: CloseEvent) => void;
    onError?: (event: Event) => void;
  } = {}
) {
  const wsRef = useRef<WebSocketProvider | null>(null);
  const hasConnectedRef = useRef(false);
  const optionsRef = useRef(options);

  useLayoutEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // 手动断开连接的方法
  const disconnect = (isAuto?: boolean) => {
    if (!isAuto) {
      // 仅主动断开时设置
      hasConnectedRef.current = false;
    }
    if (wsRef.current) {
      console.trace('断开 WebSocket 连接');
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  // 建立连接
  const connect = () => {
    if (!url) return;
    disconnect();

    hasConnectedRef.current = true;
    const instance = new WebSocketProvider(url, {
      ...optionsRef.current,
      automaticOpen: true, // 既然手动调了 connect，就强制开启
    });

    instance.onopen = (e) => optionsRef.current.onOpen?.(e);
    instance.onconnecting = (e) => optionsRef.current.onConnecting?.(e);
    instance.onmessage = (e) => optionsRef.current.onMessage?.(e);
    instance.onerror = (e) => optionsRef.current.onError?.(e);
    instance.onclose = (e) => optionsRef.current.onClose?.(e);
    wsRef.current = instance;
    return instance;
  };

  useEffect(() => {
    if (options.automaticOpen) {
      connect();
    }
  }, [url, options.automaticOpen]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        disconnect(true);
      } else {
        setTimeout(() => {
          if (hasConnectedRef.current) {
            connect();
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 组件卸载时安全清理
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // 暴露给外部的方法
  return {
    get ws() {
      return wsRef.current;
    },
    connect,
    disconnect,
    send: useCallback((data: string | ArrayBuffer | Blob) => {
      wsRef.current?.send(data);
    }, []),
  };
}
