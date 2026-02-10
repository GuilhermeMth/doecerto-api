import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';
import { CacheableMemory } from 'cacheable';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const redisUri = `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;
        
        return {
          stores: [
            // Camada 1: Memória (Rápida)
            new Keyv({
              store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
            }),
            // Camada 2: Redis (Persistente/Compartilhada)
            new KeyvRedis(redisUri),
          ],
        };
      },
    }),
  ],
  exports: [CacheModule, CacheService],
  providers: [CacheService],  
})
export class CacheConfigModule {}