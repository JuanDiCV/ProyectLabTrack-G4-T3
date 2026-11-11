import NodeCache from 'node-cache';

/** Abstracción de caché para desacoplar los servicios de node-cache. */
export interface CacheStore {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  flush(): void;
}

/** Implementación en memoria con TTL basada en node-cache (CP-013: carga con JMeter). */
export class NodeCacheStore implements CacheStore {
  private readonly cache: NodeCache;

  constructor(ttlSeconds: number) {
    this.cache = new NodeCache({ stdTTL: ttlSeconds, checkperiod: ttlSeconds * 2, useClones: false });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set<T>(key: string, value: T): void {
    this.cache.set<T>(key, value);
  }

  flush(): void {
    this.cache.flushAll();
  }
}

/** Caché simple en memoria (útil en pruebas). */
export class MemoryCacheStore implements CacheStore {
  private readonly store = new Map<string, unknown>();

  get<T>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, value);
  }

  flush(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}
