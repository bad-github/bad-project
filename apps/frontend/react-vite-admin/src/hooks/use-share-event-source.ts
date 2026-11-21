import {StorageKeys} from '../utils/storage-keys';
import {useCallback, useEffect, useRef, useState} from 'react';

interface UseSharedSSEParams {
  baseUrl: string;
  urlParams?: Record<string, any>;
  withCredentials?: boolean;
  onError?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onOpen?: (event: Event) => void;
}

interface SharedSSEState {
  isLeader: boolean;
  readyState: number;
  disconnect: () => void;
  connect: (params?: Partial<UseSharedSSEParams>) => void;
}

const buildUrl = (baseUrl: string, urlParams?: Record<string, any>) => {
  if (!urlParams) return baseUrl;
  const query = new URLSearchParams(urlParams).toString();
  return `${baseUrl}?${query}`;
};
// todo
export default function useSharedSSE(initialParams: UseSharedSSEParams): SharedSSEState {
  const [readyState, setReadyState] = useState<number>(EventSource.CLOSED);
  const [isLeader, setIsLeader] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setReadyState(EventSource.CLOSED);
    }
  }, []);

  const connect = useCallback(
    (params?: Partial<UseSharedSSEParams>) => {
      const {baseUrl, withCredentials = true, urlParams, onError, onMessage, onOpen} = {...initialParams, ...params};

      const eventSource = new EventSource(buildUrl(baseUrl, urlParams), {
        withCredentials,
      });

      eventSource.onopen = (event) => {
        setReadyState(eventSource.readyState);
        onOpen?.(event);
      };

      eventSource.onmessage = (event) => {
        // Leader 把消息广播给其它标签页
        channelRef.current?.postMessage({type: 'SSE_MESSAGE', data: event.data});
        onMessage?.(event);
      };

      eventSource.onerror = (event) => {
        setReadyState(eventSource.readyState);
        onError?.(event);
        eventSource.close();
      };

      eventSourceRef.current = eventSource;
      setReadyState(eventSource.readyState);
    },
    [initialParams]
  );

  useEffect(() => {
    const channel = new BroadcastChannel('shared_sse_channel');
    channelRef.current = channel;

    // 收到其它标签页的 SSE 消息
    channel.onmessage = (e) => {
      if (e.data?.type === 'SSE_MESSAGE' && !isLeader) {
        initialParams.onMessage?.({data: e.data.data} as MessageEvent);
      }
      if (e.data?.type === 'LEADER_PING') {
        // 有 Leader 存在
        if (isLeader) {
          disconnect();
          setIsLeader(false);
        }
      }
    };

    // Leader 选举机制
    const tryBecomeLeader = () => {
      const lastPing = parseInt(localStorage.getItem(StorageKeys.sharedSsePing) || '0', 10);
      if (!lastPing || Date.now() - lastPing > 3000) {
        // 成为 Leader
        setIsLeader(true);
        connect();
      }
    };

    const pingInterval = setInterval(() => {
      if (isLeader) {
        localStorage.setItem(StorageKeys.sharedSsePing, String(Date.now()));
        channel.postMessage({type: 'LEADER_PING'});
      } else {
        tryBecomeLeader();
      }
    }, 2000);

    tryBecomeLeader();

    return () => {
      clearInterval(pingInterval);
      disconnect();
      channel.close();
    };
  }, []);

  return {
    isLeader,
    readyState,
    disconnect,
    connect,
  };
}
