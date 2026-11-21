import {useEffect, useRef, useState} from 'react';
import {createOrderQueue, emptySnapshot, type OrderQueue} from './order-queue';
import type {Traffic, BatchSize} from './order-model';

export function useOrderQueue() {
  const instance = useRef<OrderQueue | null>(null);
  const [snapshot, setSnapshot] = useState(emptySnapshot);

  useEffect(() => {
    const queue = createOrderQueue(setSnapshot);
    instance.current = queue;
    return () => {
      // 重置可能已替换实例，卸载时也必须释放替换后的队列。
      instance.current?.dispose();
      instance.current = null;
    };
  }, []);

  return {
    snapshot,
    start: () => instance.current?.start(),
    setTraffic: (traffic: Traffic) => instance.current?.setTraffic(traffic),
    setTotal: (total: BatchSize) => instance.current?.setTotal(total),
    togglePause: () => instance.current?.togglePause(),
    drain: () => instance.current?.drain(),
    retryFailed: () => instance.current?.retryFailed(),
    reset: () => {
      const previous = instance.current?.snapshot();
      instance.current?.dispose();
      const queue = createOrderQueue(setSnapshot, {total: previous?.total, traffic: previous?.traffic});
      instance.current = queue;
      setSnapshot(queue.snapshot());
    },
  };
}
