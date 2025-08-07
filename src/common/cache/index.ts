import Redis, { Cluster } from 'ioredis';
import { RedisConfig } from '../config';
import { initRedisClient } from '../redis';

export interface CacheManager {
  isRedis: () => boolean;
  get(key: string): Promise<string | null>;
  mget(keys: string[]): Promise<(string | null)[]>;
  set(key: string, value: string | Buffer | number, secondsToken?: 'EX', seconds?: number | string): Promise<'OK'>;
  sadd(key: string, member: string): Promise<number>;
  smembers(key: string): Promise<string[]>;
  sismember(key: string, member: string): Promise<number>;
  scard(key: string): Promise<number>;
  del(...keys: string[]): Promise<number>;
  setex(key: string, seconds: number, value: string): Promise<'OK'>;
  expire(key: string, seconds: number): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  zcard?(key: string): Promise<number>;
  zrange(key: string, start: number, stop: number, options?: string): Promise<string[]>;
  zrevrange(key: string, start: number, stop: number, options?: string): Promise<string[]>;
  zadd(key: string, score: number, member: string): Promise<number>;
  hincrby(key: string, field: string, increment: number): Promise<number>;
  hgetall(key: string): Promise<Record<string, string>>;
  hmset(key: string, object: Record<string, string>): Promise<'OK'>;
  hset(key: string, object: Record<string, string>): Promise<number>;
  pipeline?(): any;
}

export class InMemoryCache implements CacheManager {
  private storage: { [x: string]: any } = {};

  public isRedis() {
    return false;
  }

  public async get(key: string): Promise<string | null> {
    return new Promise((resolve) => resolve(this.storage[key]));
  }

  public async mget(keys: string[]): Promise<(string | null)[]> {
    return new Promise((resolve) => {
      resolve(keys.map((key) => this.storage[key] || null));
    });
  }

  public async set(key: string, value: string | number | Buffer): Promise<'OK'> {
    this.storage[key] = value;
    return new Promise((resolve) => resolve('OK'));
  }

  public async sadd(key: string, member: string): Promise<number> {
    if (!this.storage[key]) {
      this.storage[key] = new Set<string>();
    }
    if (!(this.storage[key] instanceof Set)) {
      return 0;
    }
    if (this.storage[key].has(member)) {
      return 0;
    }
    this.storage[key].add(member);
    return 1;
  }

  public async smembers(key: string): Promise<string[]> {
    if (!this.storage[key] || !(this.storage[key] instanceof Set)) {
      return [];
    }
    return Array.from(this.storage[key]);
  }

  public async sismember(key: string, member: string): Promise<number> {
    if (!this.storage[key] || !(this.storage[key] instanceof Set)) {
      return 0;
    }
    return this.storage[key].has(member) ? 1 : 0;
  }

  public async scard(key: string): Promise<number> {
    if (!this.storage[key] || !(this.storage[key] instanceof Set)) {
      return 0;
    }
    return this.storage[key].size;
  }

  public async del(...keys: string[]): Promise<number> {
    let deletedCount = 0;
    for (const key of keys) {
      if (this.storage[key] !== undefined) {
        delete this.storage[key];
        deletedCount++;
      }
    }
    return deletedCount;
  }

  public async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    this.storage[key] = value;
    return 'OK';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async expire(_key: string, _seconds: number): Promise<number> {
    return 1;
  }

  public async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Object.keys(this.storage).filter((key) => regex.test(key));
  }

  public async zcard(key: string): Promise<number> {
    if (!this.storage[key] || !(this.storage[key] instanceof Map)) {
      return 0;
    }
    return this.storage[key].size;
  }

  public async zrange(key: string, start: number, stop: number, options?: string): Promise<string[]> {
    if (!this.storage[key] || !(this.storage[key] instanceof Map)) {
      return [];
    }
    const sortedEntries = Array.from(this.storage[key].entries()).sort((a, b) => a[1] - b[1]);
    const members = sortedEntries.map(([member]) => member);
    const result = members.slice(start, stop === -1 ? undefined : stop + 1);

    if (options === 'WITHSCORES') {
      const withScores = [];
      for (let i = 0; i < result.length; i++) {
        withScores.push(result[i]);
        withScores.push(this.storage[key].get(result[i]).toString());
      }
      return withScores;
    }
    return result;
  }

  public async zrevrange(key: string, start: number, stop: number, options?: string): Promise<string[]> {
    if (!this.storage[key] || !(this.storage[key] instanceof Map)) {
      return [];
    }
    const sortedEntries = Array.from(this.storage[key].entries()).sort((a, b) => b[1] - a[1]);
    const members = sortedEntries.map(([member]) => member);
    const result = members.slice(start, stop === -1 ? undefined : stop + 1);

    if (options === 'WITHSCORES') {
      const withScores = [];
      for (let i = 0; i < result.length; i++) {
        withScores.push(result[i]);
        withScores.push(this.storage[key].get(result[i]).toString());
      }
      return withScores;
    }
    return result;
  }

  public async zadd(key: string, score: number, member: string): Promise<number> {
    if (!this.storage[key]) {
      this.storage[key] = new Map();
    }
    if (!(this.storage[key] instanceof Map)) {
      this.storage[key] = new Map();
    }
    const wasNew = !this.storage[key].has(member);
    this.storage[key].set(member, score);
    return wasNew ? 1 : 0;
  }

  public async hincrby(key: string, field: string, increment: number): Promise<number> {
    if (!this.storage[key]) {
      this.storage[key] = {};
    }
    if (typeof this.storage[key] !== 'object' || Array.isArray(this.storage[key])) {
      this.storage[key] = {};
    }
    const currentValue = parseInt(this.storage[key][field] || '0');
    const newValue = currentValue + increment;
    this.storage[key][field] = newValue.toString();
    return newValue;
  }

  public async hgetall(key: string): Promise<Record<string, string>> {
    if (!this.storage[key] || typeof this.storage[key] !== 'object' || Array.isArray(this.storage[key])) {
      return {};
    }
    return { ...this.storage[key] };
  }

  public async hmset(key: string, object: Record<string, string>): Promise<'OK'> {
    if (!this.storage[key]) {
      this.storage[key] = {};
    }
    Object.assign(this.storage[key], object);
    return 'OK';
  }

  public async hset(key: string, object: Record<string, string>): Promise<number> {
    if (!this.storage[key]) {
      this.storage[key] = {};
    }
    let fieldsSet = 0;
    for (const field in object) {
      if (!this.storage[key].hasOwnProperty(field)) {
        fieldsSet++;
      }
      this.storage[key][field] = object[field];
    }
    return fieldsSet;
  }

  public pipeline(): any {
    // Simple mock pipeline for in-memory cache
    const commands: Array<() => Promise<any>> = [];
    return {
      hmset: (key: string, object: Record<string, string>) => {
        commands.push(() => this.hmset(key, object));
        return this;
      },
      zadd: (key: string, score: number, member: string) => {
        commands.push(() => this.zadd(key, score, member));
        return this;
      },
      sadd: (key: string, member: string) => {
        commands.push(() => this.sadd(key, member));
        return this;
      },
      expire: (key: string, seconds: number) => {
        commands.push(() => this.expire(key, seconds));
        return this;
      },
      exec: async () => {
        const results = [];
        for (const command of commands) {
          results.push(await command());
        }
        return results.map((result) => [null, result]);
      },
    };
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

  public async mget(keys: string[]): Promise<(string | null)[]> {
    return await this.redis.mget(keys);
  }

  public async set(key: string, value: string | Buffer | number, secondsToken: 'EX' = 'EX', seconds: number | string = 3600) {
    return await this.redis.set(key, value, secondsToken, seconds);
  }

  public async sadd(key: string, member: string): Promise<number> {
    return await this.redis.sadd(key, member);
  }

  public async smembers(key: string): Promise<string[]> {
    return await this.redis.smembers(key);
  }

  public async sismember(key: string, member: string): Promise<number> {
    return await this.redis.sismember(key, member);
  }

  public async scard(key: string): Promise<number> {
    return await this.redis.scard(key);
  }

  public async del(...keys: string[]) {
    return await this.redis.del(...keys);
  }

  public async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    return await this.redis.setex(key, seconds, value);
  }

  public async expire(key: string, seconds: number): Promise<number> {
    return await this.redis.expire(key, seconds);
  }

  public async keys(pattern: string): Promise<string[]> {
    return await this.redis.keys(pattern);
  }

  public async zcard(key: string): Promise<number> {
    return await this.redis.zcard(key);
  }

  public async zrange(key: string, start: number, stop: number, options?: string): Promise<string[]> {
    if (options === 'WITHSCORES') {
      return await this.redis.zrange(key, start, stop, 'WITHSCORES');
    }
    return await this.redis.zrange(key, start, stop);
  }

  public async zrevrange(key: string, start: number, stop: number, options?: string): Promise<string[]> {
    if (options === 'WITHSCORES') {
      return await this.redis.zrevrange(key, start, stop, 'WITHSCORES');
    }
    return await this.redis.zrevrange(key, start, stop);
  }

  public async zadd(key: string, score: number, member: string): Promise<number> {
    return await this.redis.zadd(key, score, member);
  }

  public async hincrby(key: string, field: string, increment: number): Promise<number> {
    return await this.redis.hincrby(key, field, increment);
  }

  public async hgetall(key: string): Promise<Record<string, string>> {
    return await this.redis.hgetall(key);
  }

  public async hmset(key: string, object: Record<string, string>): Promise<'OK'> {
    return await this.redis.hmset(key, object);
  }

  public async hset(key: string, object: Record<string, string>): Promise<number> {
    return await this.redis.hset(key, object);
  }

  public pipeline() {
    return this.redis.pipeline();
  }
}
