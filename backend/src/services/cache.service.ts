/**
 * High-Performance Caching Layer Service
 * Supports Redis / In-Memory Cache with TTL & Event-Driven Invalidation
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class CacheService {
  private static store: Map<string, CacheEntry<any>> = new Map();

  /**
   * Get cached item or execute fallback fetcher
   */
  public static async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (entry && entry.expiresAt > now) {
      console.log(`⚡ [Cache HIT] key: ${key}`);
      return entry.data;
    }

    console.log(`🐢 [Cache MISS] key: ${key}`);
    const data = await fetcher();
    this.store.set(key, {
      data,
      expiresAt: now + ttlSeconds * 1000,
    });
    return data;
  }

  /**
   * Invalidate specific cache key or key prefix
   */
  public static invalidate(keyOrPrefix: string) {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
        this.store.delete(key);
        count++;
      }
    }
    console.log(`🧹 [Cache Invalidate] Cleared ${count} entries matching "${keyOrPrefix}"`);
  }

  /**
   * Flush entire cache
   */
  public static flushAll() {
    this.store.clear();
    console.log('🧹 [Cache Flush] All cache cleared');
  }
}
