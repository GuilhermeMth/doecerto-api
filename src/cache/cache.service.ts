import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import type { Redis } from 'ioredis';

interface CacheStore {
  stores?: Array<{ opts?: { store?: { client?: Redis } }; client?: Redis }>;
  client?: Redis;
  opts?: { client?: Redis };
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  private generateKey(filters: object, userId: number): string {
    return `catalog:${userId}:${JSON.stringify(filters)}`;
  }

  async get<T>(filters: object, userId: number): Promise<T | undefined> {
    const key = this.generateKey(filters, userId);
    return this.cacheManager.get<T>(key);
  }

  async set<T>(
    filters: object,
    userId: number,
    value: T,
    ttlSeconds: number,
  ): Promise<void> {
    const key = this.generateKey(filters, userId);
    await this.cacheManager.set(key, value, ttlSeconds * 1000);
  }

  async delByPrefix(prefix: string): Promise<void> {
    const redis = this.getRedisClient();

    if (!redis) {
      await this.cacheManager.clear();
      return;
    }

    try {
      const stream = redis.scanStream({
        match: `${prefix}*`,
        count: 100,
      }) as AsyncIterable<string[]>;

      for await (const keys of stream) {
        if (keys && keys.length > 0) {
          await redis.del(...keys);
        }
      }
      this.logger.log(`🧹 Cache invalidado para o prefixo: ${prefix}`);
    } catch (error) {
      this.logger.error(`Erro ao invalidar prefixo ${prefix}:`, error);
    }
  }

  private getRedisClient(): Redis | null {
    const store = (this.cacheManager as unknown as { store?: CacheStore })
      .store;
    if (!store) return null;

    // Para cache-manager com múltiplas stores
    if (store.stores && Array.isArray(store.stores)) {
      for (const s of store.stores) {
        const client = s?.opts?.store?.client || s?.client;
        if (client) return client;
      }
    }

    // Para redis-store direto
    return store.client || store.opts?.client || null;
  }

  async clear(): Promise<void> {
    await this.cacheManager.clear();
    this.logger.log('🗑️ Cache global limpo');
  }
}
