import { describe, expect, it, vi } from 'vitest';
import { DataForSeoMemoryCacheService } from './dataforseo-memory-cache.service.js';

describe('DataForSeoMemoryCacheService', () => {
  it('does not persist entries when cache ttl is disabled', () => {
    const cache = new DataForSeoMemoryCacheService();

    cache.set('disabled', { ok: true }, 0);

    expect(cache.get('disabled')).toBeNull();
  });

  it('evicts expired entries before admitting new values', () => {
    const cache = new DataForSeoMemoryCacheService();
    const now = vi.spyOn(Date, 'now');

    now.mockReturnValue(1000);
    cache.set('first', { value: 1 }, 50);
    now.mockReturnValue(1100);

    expect(cache.get('first')).toBeNull();

    cache.set('second', { value: 2 }, 1000);
    expect(cache.get('second')).toEqual({ value: 2 });

    now.mockRestore();
  });
});
