import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
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

  async delByPrefix(prefix: string): Promise<void> {
    const store = (this.cacheManager as any).store;
    const redisStore = store?.stores?.find((s: any) => s?.opts?.store?.client || s?.client);
    const redis = redisStore?.opts?.store?.client || redisStore?.client;

    if (!redis) {
      this.logger.warn('Redis client não encontrado para SCAN. Limpando cache global como fallback.');
      await this.cacheManager.clear();
      return;
    }

    try {
      const stream = redis.scanStream({
        match: `${prefix}*`,
        count: 100,
      });

      for await (const keys of stream) {
        if (keys.length > 0) {
          await redis.del(keys);
        }
      }
      this.logger.log(`🧹 Cache invalidado para o prefixo: ${prefix}`);
    } catch (error) {
      this.logger.error(`Erro ao invalidar prefixo ${prefix}:`, error);
    }
  }

  async clear(): Promise<void> {
    await this.cacheManager.clear();
    this.logger.log('🗑️ Cache global limpo');
  }
}