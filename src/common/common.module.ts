import { config } from '@/common/config';
import { InMemoryLockManager, RedisLockManager } from '@/common/utils/lock';
import { Global, Module } from '@nestjs/common';
import { InMemoryCache, RedisCache } from './cache';
import { InMemoryRateLimiter, RedisRateLimiter } from './utils/rate-limiter';

export const LOCK_TOKEN = 'LOCK';
export const CACHE_TOKEN = 'CACHE';
export const RATE_LIMITER_TOKEN = 'RATE_LIMITER';

@Global()
@Module({
  providers: [
    {
      provide: LOCK_TOKEN,
      useFactory: () => {
        return config.redis.url ? new RedisLockManager(config.redis.url) : new InMemoryLockManager();
      },
    },
    {
      provide: CACHE_TOKEN,
      useFactory: () => {
        return config.redis.url ? new RedisCache(config.redis.url) : new InMemoryCache();
      },
    },
    {
      provide: RATE_LIMITER_TOKEN,
      useFactory: () => {
        return config.redis.url ? new RedisRateLimiter(config.redis.url) : new InMemoryRateLimiter();
      },
    },
  ],
  imports: [],
  exports: [LOCK_TOKEN, CACHE_TOKEN, RATE_LIMITER_TOKEN],
})
export class CommonModule {}
