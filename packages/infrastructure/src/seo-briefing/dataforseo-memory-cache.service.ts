import { Injectable } from '@nestjs/common';

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

const DEFAULT_MAX_CACHE_ENTRIES = 1000;

@Injectable()
export class DataForSeoMemoryCacheService {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly maxEntries = DEFAULT_MAX_CACHE_ENTRIES;

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    if (ttlMs <= 0) {
      return;
    }

    this.pruneExpiredEntries();
    while (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (!oldestKey) {
        break;
      }
      this.store.delete(oldestKey);
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + Math.max(0, ttlMs),
    });
  }

  private pruneExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }
}
