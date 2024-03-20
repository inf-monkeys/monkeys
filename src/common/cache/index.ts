import Redis from 'ioredis';

export interface CacheManager {
  get(key: string): Promise<string | null>;
  set(key: string, value: string | Buffer | number, secondsToken: 'EX', seconds: number | string): Promise<'OK'>;
}

export class InMemoryCache implements CacheManager {
  private storage: { [x: string]: any } = {};

  public async get(key: string): Promise<string | null> {
    return this.storage[key];
  }

  public async set(key: string, value: string | number | Buffer): Promise<'OK'> {
    this.storage[key] = value;
    return 'OK';
  }
}

export class RedisCache implements CacheManager {
  redis: Redis;
  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  public async get(key: string): Promise<string> {
    return await this.redis.get(key);
  }

  public async set(key: string, value: string | Buffer | number, secondsToken: 'EX', seconds: number | string) {
    return await this.redis.set(key, value, secondsToken, seconds);
  }
}
