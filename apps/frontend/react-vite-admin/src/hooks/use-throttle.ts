import {useCallback, useEffect, useLayoutEffect, useRef} from 'react';
import {Subject, Subscription, throttleTime} from 'rxjs';

type ObserverOptions<T> = {
  throttleMs?: number;
  observer?: (value: T) => void;
};

// 限制发送事件的频率
export default function useThrottle<T>({throttleMs = 300, observer}: ObserverOptions<T> = {}) {
  const subject = useRef<Subject<T>>(new Subject<T>());
  const subscription = useRef<Subscription | null>(null);
  const observerRef = useRef<typeof observer | null>(null);

  useLayoutEffect(() => {
    observerRef.current = observer;
  }, [observer]);

  const unsubscribe = useCallback(() => {
    subscription.current?.unsubscribe();
    subscription.current = null;
  }, []);

  useEffect(() => {
    subscription.current = subject.current.pipe(throttleTime(throttleMs)).subscribe((value) => {
      if (observerRef.current) {
        observerRef.current(value);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [throttleMs, observer, unsubscribe]);

  const next = useCallback((value: T) => {
    subject.current.next(value);
  }, []);

  return {next, unsubscribe};
}
