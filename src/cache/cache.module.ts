import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Importe estes
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';
import { CacheableMemory } from 'cacheable';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule], // Importante injetar o ConfigModule aqui
      inject: [ConfigService], // Injetar o serviço para ler as variáveis
      useFactory: async (configService: ConfigService) => {
        // Agora você usa o configService com fallback
        const host = configService.get<string>('REDIS_HOST') || 'localhost';
        const port = parseInt(configService.get<string>('REDIS_PORT') || '6379', 10);
        const redisUri = `redis://${host}:${port}`;
        
        return {
          stores: [
            // Camada 1: Memória (L1)
            new Keyv({
              store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
            }),
            // Camada 2: Redis (L2)
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