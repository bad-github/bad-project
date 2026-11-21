import {useCallback, useEffect, useLayoutEffect, useRef} from 'react';
import {bufferTime, concatMap, filter, map, merge, skip, Subject, Subscription, take} from 'rxjs';

type ObserverOptions<T> = {
  bufferMs?: number;
  observer?: (value: T[]) => void | Promise<void>;
};

// todo
export default function useBuffer<T>({bufferMs = 16, observer}: ObserverOptions<T> = {}) {
  const subject = useRef<Subject<T>>(new Subject<T>());
  const subscription = useRef<Subscription | null>(null);
  const observerRef = useRef<typeof observer | null>(null);

  useLayoutEffect(() => {
    observerRef.current = observer;
  }, [observer]);

  const handleSubscribe = useCallback(() => {
    if (subscription.current && !subscription.current.closed) return;
    console.log('useBuffer 重建');
    const source$ = subject.current.asObservable();
    // 立即处理第一个值
    const first$ = source$.pipe(
      take(1),
      // 将单个值包装成数组，保持和 observer 接口一致
      map((val) => [val])
    );
    // 后续值走缓冲逻辑
    const consecutive$ = source$.pipe(
      skip(1),
      bufferTime(bufferMs),
      filter((list) => list.length > 0)
    );
    subscription.current = merge(first$, consecutive$)
      .pipe(
        concatMap(async (batch) => {
          if (observerRef.current) {
            await observerRef.current(batch);
          }
        })
      )
      .subscribe();
    // 每16ms更新一批数据，bufferTime会合并所有事件，所以数据是包含之前的
    /* subscription.current = subject.current
      .pipe(
        bufferTime(bufferMs),
        filter(list => list.length > 0),
        concatMap(async batch => {
          if (observerRef.current) {
            await observerRef.current(batch);
          }
        })
      )
      .subscribe(); */
  }, [bufferMs]);

  const unsubscribe = useCallback(() => {
    console.log('useBuffer 销毁');
    subscription.current?.unsubscribe();
    subscription.current = null;
  }, []);

  useEffect(() => {
    handleSubscribe();
    return () => {
      unsubscribe();
    };
  }, [handleSubscribe, unsubscribe]);

  const next = useCallback((data: T | T[]) => {
    if (Array.isArray(data)) {
      data.forEach((d) => subject.current.next(d));
    } else {
      subject.current.next(data);
    }
  }, []);

  // 断线重连
  const subscribe = useCallback(() => {
    if (!subscription.current || subscription.current.closed) {
      handleSubscribe();
    }
  }, [handleSubscribe]);

  return {next, subscribe, unsubscribe};
}
