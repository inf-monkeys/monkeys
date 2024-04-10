import Redis from 'ioredis';

export interface RateLimiter {
  can(key: string, windowMs: number, max: number): Promise<boolean>;
}

export class InMemoryRateLimiter implements RateLimiter {
  async can(): Promise<boolean> {
    return true;
  }
}

export class RedisRateLimiter implements RateLimiter {
  redis: Redis;
  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  async can(key: string, windowMs: number, max: number): Promise<boolean> {
    const now = +new Date();
    const startTime = now - windowMs;

    // 清理过期的窗口
    await this.redis.zremrangebyscore(key, '-inf', startTime);

    // 获取当前窗口内的请求数量
    const count = await this.redis.zrangebyscore(key, startTime, '+inf', 'WITHSCORES');

    // 如果请求数量超过限流阈值，则拒绝请求
    if (count.length >= max * 2) {
      return false;
    }

    // 添加当前请求到窗口中
    await this.redis.zadd(key, now, now);

    // 设置窗口过期时间
    await this.redis.expire(key, windowMs / 1000);
    return true;
  }
}
