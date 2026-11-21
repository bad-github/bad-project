import {Subject, Subscription} from 'rxjs';
import {filter, map, take} from 'rxjs/operators';

export const Events = {
  ADD: 'add',
  DIFF: 'diff',
  SUM: 'sum',
} as const;

export type TEvents = (typeof Events)[keyof typeof Events];

// 定义事件类型
type EventMap = {
  [Events.ADD]: void; // 无参数
  [Events.DIFF]: number; // 单个参数
  [Events.SUM]: {num1: number; num2: number}; // 多个参数
};

class EventBus {
  private subject = new Subject<{type: keyof EventMap; payload?: any}>();

  /**
   * 发布事件
   */
  emit<T extends keyof EventMap>(type: T, payload?: EventMap[T]) {
    this.subject.next({type, payload});
  }

  /**
   * 订阅事件
   * 返回 Subscription
   */
  on<T extends keyof EventMap>(type: T, callback: (payload: EventMap[T]) => void): Subscription {
    return this.subject
      .pipe(
        filter((event) => event.type === type),
        map((event) => event.payload as EventMap[T])
      )
      .subscribe(callback);
  }

  /**
   * 订阅事件一次（触发一次后自动取消）
   */
  once<T extends keyof EventMap>(type: T, callback: (payload: EventMap[T]) => void): Subscription {
    return this.subject
      .pipe(
        filter((event) => event.type === type),
        map((event) => event.payload as EventMap[T]),
        take(1) // 只触发一次
      )
      .subscribe(callback);
  }

  /**
   * 订阅多个事件
   */
  onMultiple<T extends keyof EventMap>(types: T[], callback: (type: T, payload: EventMap[T]) => void): Subscription {
    return this.subject
      .pipe(filter((event) => types.includes(event.type as T)))
      .subscribe((event) => callback(event.type as T, event.payload as EventMap[T]));
  }

  /**
   * 清空所有订阅
   */
  clear() {
    this.subject.complete();
    this.subject = new Subject();
  }
}

export const eventBus = new EventBus();
