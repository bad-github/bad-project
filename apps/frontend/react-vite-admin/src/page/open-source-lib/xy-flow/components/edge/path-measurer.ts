class PathMeasurer {
  private static instance: PathMeasurer;
  private measurer: SVGPathElement | null = null;
  private cache: Map<string, number> = new Map();
  private maxCacheSize = 2000;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.measurer = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    }
  }

  public static getInstance(): PathMeasurer {
    if (!PathMeasurer.instance) {
      PathMeasurer.instance = new PathMeasurer();
    }
    return PathMeasurer.instance;
  }

  /**
   * 测量方法
   * @param pathData SVG 路径字符串 (d 属性)
   */
  public getLength(pathData: string): number {
    if (!pathData || !this.measurer) return 0;
    // 优先从缓存读取
    if (this.cache.has(pathData)) {
      return this.cache.get(pathData)!;
    }
    // 缓存失效，执行真实测量
    this.measurer.setAttribute('d', pathData);
    const length = this.measurer.getTotalLength() || 0;
    // 写入缓存并限制缓存大小
    this.pruneCache();
    this.cache.set(pathData, length);
    return length;
  }

  /**
   * 限制缓存大小，遵循LRU策略
   */
  public pruneCache(): void {
    if (this.cache.size <= this.maxCacheSize) return;
    const deleteCount = this.cache.size - this.maxCacheSize;
    for (let i = 0; i < deleteCount; i++) {
      // Map.keys().next() 总是指向最早插入（最久未使用）的那个键
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
  }

  /**
   * 清除缓存（在某些极端场景下手动调用）
   */
  public clearCache(): void {
    this.cache.clear();
  }
}

export const pathMeasurer = PathMeasurer.getInstance();
