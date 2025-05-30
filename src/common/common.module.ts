import { config, isRedisConfigured } from '@/common/config';
import { InMemoryLockManager, RedisLockManager } from '@/common/utils/lock';
import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { InMemoryCache, RedisCache } from './cache';
import { EventEmitterMq, RedisMq } from './mq';
import { InMemoryRateLimiter, RedisRateLimiter } from './utils/rate-limiter';

export const LOCK_TOKEN = 'LOCK';
export const CACHE_TOKEN = 'CACHE';
export const RATE_LIMITER_TOKEN = 'RATE_LIMITER';
export const MQ_TOKEN = 'MQ';

@Global()
@Module({
  providers: [
    {
      provide: LOCK_TOKEN,
      useFactory: () => {
        return isRedisConfigured() ? new RedisLockManager(config.redis) : new InMemoryLockManager();
      },
    },
    {
      provide: CACHE_TOKEN,
      useFactory: () => {
        return isRedisConfigured() ? new RedisCache(config.redis) : new InMemoryCache();
      },
    },
    {
      provide: RATE_LIMITER_TOKEN,
      useFactory: () => {
        return isRedisConfigured() ? new RedisRateLimiter(config.redis) : new InMemoryRateLimiter();
      },
    },
    {
      provide: MQ_TOKEN,
      useFactory: () => {
        return isRedisConfigured() ? new RedisMq(config.redis) : new EventEmitterMq();
      },
    },
  ],
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
    }),
  ],
  exports: [LOCK_TOKEN, CACHE_TOKEN, RATE_LIMITER_TOKEN, MQ_TOKEN, EventEmitterModule],
})
export class CommonModule {}
