import { Global, Module } from '@nestjs/common';
import { InMemoryCache, RedisCache } from '.';
import { config } from '../config';

@Global()
@Module({
  providers: [
    {
      provide: 'CACHE',
      useFactory: () => {
        return config.redis.url ? new RedisCache(config.redis.url) : new InMemoryCache();
      },
    },
  ],
  exports: ['CACHE'],
})
export class CacheModule {}
