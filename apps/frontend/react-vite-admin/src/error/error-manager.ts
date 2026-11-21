import type {ErrorListener} from './types';
import {normalizeError} from './tool';

class ErrorManager {
  private listeners: ErrorListener[] = [];

  report(error: any, info?: any) {
    const normalized = normalizeError(error);

    // 1️⃣ 打日志（可接入监控）
    console.error('[ErrorManager]', error, normalized, info);

    // 2️⃣ 上报服务端（可选）
    // this.sendToServer(normalized);

    // 3️⃣ 通知 UI 层
    this.listeners.forEach((l) => l(normalized));
  }

  subscribe(listener: ErrorListener) {
    this.listeners.push(listener);

    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  clearListeners() {
    this.listeners = [];
  }
}

export const errorManager = new ErrorManager();
