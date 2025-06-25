import Redis, { Cluster } from 'ioredis';
import { RedisConfig } from '../config';
import { initRedisClient } from '../redis';

export interface CacheManager {
  isRedis: () => boolean;
  get(key: string): Promise<string | null>;
  set(key: string, value: string | Buffer | number, secondsToken?: 'EX', seconds?: number | string): Promise<'OK'>;
  lpush(key: string, value: string | Buffer | number): Promise<number>;
  del(key: string): Promise<number>;
  brpop(key: string, timeout: number): Promise<[string, string] | null>;
  lrem(key: string, count: number, value: string): Promise<number>;
  setex(key: string, seconds: number, value: string): Promise<'OK'>;
  keys(pattern: string): Promise<string[]>;
  llen(key: string): Promise<number>;
}

export class InMemoryCache implements CacheManager {
  private storage: { [x: string]: any } = {};

  public isRedis() {
    return false;
  }

  public async get(key: string): Promise<string | null> {
    return new Promise((resolve) => resolve(this.storage[key]));
  }

  public async set(key: string, value: string | number | Buffer): Promise<'OK'> {
    this.storage[key] = value;
    return new Promise((resolve) => resolve('OK'));
  }

  public async lpush(key: string, value: string | Buffer | number): Promise<number> {
    if (!this.storage[key]) {
      this.storage[key] = [];
    }
    this.storage[key].push(value);
    return new Promise((resolve) => resolve(this.storage[key].length));
  }

  public async del(key: string): Promise<number> {
    delete this.storage[key];
    return new Promise((resolve) => resolve(1));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async brpop(_key: string, _timeout: number): Promise<[string, string] | null> {
    console.warn('BRPOP is not supported for InMemoryCache, returning null.');
    return null;
  }

  public async lrem(key: string, count: number, value: string): Promise<number> {
    if (!this.storage[key] || !Array.isArray(this.storage[key])) {
      return 0;
    }
    const originalLength = this.storage[key].length;
    this.storage[key] = this.storage[key].filter((item: string) => item !== value);
    return originalLength - this.storage[key].length;
  }

  public async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    this.storage[key] = value;
    return 'OK';
  }

  public async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Object.keys(this.storage).filter((key) => regex.test(key));
  }

  public async llen(key: string): Promise<number> {
    if (!this.storage[key] || !Array.isArray(this.storage[key])) {
      return 0;
    }
    return this.storage[key].length;
  }
}

export class RedisCache implements CacheManager {
  redis: Redis | Cluster;
  constructor(redisConfig: RedisConfig) {
    this.redis = initRedisClient(redisConfig);
  }

  public isRedis() {
    return true;
  }

  public async get(key: string): Promise<string> {
    return await this.redis.get(key);
  }

  public async set(key: string, value: string | Buffer | number, secondsToken: 'EX' = 'EX', seconds: number | string = 3600) {
    return await this.redis.set(key, value, secondsToken, seconds);
  }

  public async lpush(key: string, value: string | Buffer | number) {
    return await this.redis.lpush(key, value);
  }

  public async del(key: string) {
    return await this.redis.del(key);
  }

  public async brpop(key: string, timeout: number): Promise<[string, string] | null> {
    return await this.redis.brpop(key, timeout);
  }

  public async lrem(key: string, count: number, value: string): Promise<number> {
    return await this.redis.lrem(key, count, value);
  }

  public async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    return await this.redis.setex(key, seconds, value);
  }

  public async keys(pattern: string): Promise<string[]> {
    return await this.redis.keys(pattern);
  }

  public async llen(key: string): Promise<number> {
    return await this.redis.llen(key);
  }
}
