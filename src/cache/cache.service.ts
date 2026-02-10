import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private generateKey(filters: any, userId: number): string {
    return `catalog:${userId}:${JSON.stringify(filters)}`;
  }

  async get<T>(filters: any, userId: number): Promise<T | undefined> {
    const key = this.generateKey(filters, userId);
    return this.cacheManager.get<T>(key);
  }

  async set(
    filters: any,
    userId: number,
    value: any,
    ttlSeconds: number,
  ): Promise<void> {
    const key = this.generateKey(filters, userId);
    await this.cacheManager.set(key, value, ttlSeconds * 1000);
  }

  /**
   * Invalidação REAL por prefixo (Redis-only)
   * Funciona mesmo com cache em camadas
   */
  async delByPrefix(prefix: string): Promise<void> {
    const store: any = (this.cacheManager as any).store;

    // Quando usa KeyvRedis, o client real fica aqui
    const redis =
      store?.stores?.find((s) => s?.client)?.client ??
      store?.client;

    if (!redis) {
      this.logger.warn('Redis client not found, skipping prefix invalidation');
      return;
    }

    const stream = redis.scanStream({
      match: `${prefix}*`,
      count: 100,
    });

    const keys: string[] = [];

    for await (const chunk of stream) {
      keys.push(...chunk);
    }

    if (keys.length > 0) {
      await redis.del(keys);
      this.logger.log(`🧹 Cache invalidated (${keys.length} keys) for prefix ${prefix}`);
    }
  }

  async clear(): Promise<void> {
    await this.cacheManager.clear();
    this.logger.log('🗑️ Global cache cleared');
  }
}
