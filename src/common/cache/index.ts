import Redis from 'ioredis';

export interface CacheManager {
  isRedis: () => boolean;
  get(key: string): Promise<string | null>;
  set(key: string, value: string | Buffer | number, secondsToken?: 'EX', seconds?: number | string): Promise<'OK'>;
  lpush(key: string, value: string | Buffer | number): Promise<number>;
  subscribe(channel: string, callback: (message: string) => void): void;
}

export class InMemoryCache implements CacheManager {
  private storage: { [x: string]: any } = {};

  public isRedis() {
    return false;
  }

  public async get(key: string): Promise<string | null> {
    return this.storage[key];
  }

  public async set(key: string, value: string | number | Buffer): Promise<'OK'> {
    this.storage[key] = value;
    return 'OK';
  }

  public async lpush(key: string, value: string | Buffer | number): Promise<number> {
    if (!this.storage[key]) {
      this.storage[key] = [];
    }
    this.storage[key].push(value);
    return this.storage[key].length;
  }

  public async subscribe() {
    throw new Error('Method not implemented.');
  }
}

export class RedisCache implements CacheManager {
  redis: Redis;
  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  public isRedis() {
    return true;
  }

  public async get(key: string): Promise<string> {
    return await this.redis.get(key);
  }

  public async set(key: string, value: string | Buffer | number, secondsToken: 'EX', seconds: number | string) {
    return await this.redis.set(key, value, secondsToken, seconds);
  }

  public async lpush(key: string, value: string | Buffer | number) {
    return await this.redis.lpush(key, value);
  }

  public async subscribe(channel: string, callback: (message: string) => void) {
    this.redis.subscribe(channel);
    this.redis.on('message', callback);
  }
}
