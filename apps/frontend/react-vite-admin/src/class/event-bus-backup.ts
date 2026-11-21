type EventHandler<T = any> = (payload: T) => void;

class EventBus {
  private events: Map<string, Set<EventHandler>> = new Map();

  // 订阅事件
  on<T = any>(event: string, handler: EventHandler<T>): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler as EventHandler);
  }

  // 取消订阅
  off<T = any>(event: string, handler: EventHandler<T>): void {
    this.events.get(event)?.delete(handler as EventHandler);
  }

  // 触发事件
  emit<T = any>(event: string, payload?: T): void {
    this.events.get(event)?.forEach((handler) => {
      handler(payload);
    });
  }

  // 清除某个事件的所有订阅
  clear(event: string): void {
    this.events.delete(event);
  }

  // 清除所有事件订阅
  clearAll(): void {
    this.events.clear();
  }
}

export const eventBus = new EventBus();
