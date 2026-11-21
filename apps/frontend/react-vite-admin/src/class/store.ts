import {StorageKeys} from '../utils/storage-keys';
type StoreKey = string | number | symbol;

interface MemoryStoreOptions {
  persist?: boolean; // 是否开启持久化
  storageKey?: string; // localStorage 中的 key
}

export class MemoryStore<T = any> {
  private store: Map<StoreKey, T>;
  private persist: boolean;
  private storageKey: string;

  constructor(options?: MemoryStoreOptions) {
    this.persist = options?.persist ?? false;
    this.storageKey = options?.storageKey ?? StorageKeys.memoryStore;
    this.store = new Map();

    if (this.persist) {
      this.loadFromStorage();
    }
  }

  private saveToStorage() {
    if (!this.persist) return;
    const obj = Object.fromEntries(this.store);
    localStorage.setItem(this.storageKey, JSON.stringify(obj));
  }

  private loadFromStorage() {
    const raw = localStorage.getItem(this.storageKey);
    if (raw) {
      try {
        const obj = JSON.parse(raw);
        this.store = new Map(Object.entries(obj));
      } catch (e) {
        console.warn('Failed to parse storage:', e);
      }
    }
  }

  set(key: StoreKey, value: T): void {
    this.store.set(key, value);
    this.saveToStorage();
  }

  get(key: StoreKey): T | undefined {
    return this.store.get(key);
  }

  delete(key: StoreKey): boolean {
    const result = this.store.delete(key);
    this.saveToStorage();
    return result;
  }

  has(key: StoreKey): boolean {
    return this.store.has(key);
  }

  clear(): void {
    this.store.clear();
    this.saveToStorage();
  }

  keys(): IterableIterator<StoreKey> {
    return this.store.keys();
  }

  values(): IterableIterator<T> {
    return this.store.values();
  }

  entries(): IterableIterator<[StoreKey, T]> {
    return this.store.entries();
  }

  get size(): number {
    return this.store.size;
  }
}

export const memoryStore = new MemoryStore();
