import Redis, { Cluster } from 'ioredis';
import { RedisConfig, config } from '../config';
import { initRedisClient } from '../redis';

export interface LockManager {
  acquireLock(resourceId: string, timeout?: number): Promise<string>;
  releaseLock(resourceId: string, identifier: string): Promise<boolean>;
}

export class InMemoryLockManager implements LockManager {
  private locks: Map<string, string>;

  constructor() {
    this.locks = new Map<string, string>();
  }

  // 尝试获取锁
  async acquireLock(resourceId: string): Promise<string> {
    if (this.locks.get(resourceId)) {
      return null;
    }
    const identifier = Math.random().toString(36).slice(2); // 生成一个随机的标识符
    this.locks.set(resourceId, identifier); // 锁定资源
    return identifier;
  }

  // 释放锁
  async releaseLock(resourceId: string): Promise<boolean> {
    this.locks.delete(resourceId); // 解锁资源
    return true;
  }
}

export class RedisLockManager implements LockManager {
  redis: Redis | Cluster;
  constructor(redisConfig: RedisConfig) {
    this.redis = initRedisClient(redisConfig);
  }

  async acquireLock(resource: string, timeout = 5000) {
    const lockKey = `lock:${resource}`;
    const identifier = Math.random().toString(36).slice(2);
    const result = await this.redis.set(lockKey, identifier, 'PX', timeout, 'NX');
    return result === 'OK' ? identifier : null;
  }

  async releaseLock(resource: string, identifier: string) {
    const lockKey = `${config.server.appId}:lock:${resource}`;
    const currentIdentifier = await this.redis.get(lockKey);

    if (currentIdentifier === identifier) {
      await this.redis.del(lockKey);
      return true;
    }
    return false;
  }
}
