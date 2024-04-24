import Redis, { Cluster } from 'ioredis';
import { RedisConfig } from '../config';
import { initRedisClient } from '../redis';

export interface Mq {
  canuse: boolean;
  subscribe(channel: string, callback: (channel: string, message: string) => void): void;
  publish(channel: string, message: string): Promise<number>;
}

export class InMemoryMq implements Mq {
  canuse: boolean = false;
  subscribe() {
    throw new Error('Method not implemented.');
  }
  publish(): Promise<number> {
    throw new Error('Method not implemented.');
  }
}

export class RedisMq implements Mq {
  canuse: boolean = true;
  sub: Redis | Cluster;
  pub: Redis | Cluster;
  constructor(redisConfig: RedisConfig) {
    this.sub = initRedisClient(redisConfig);
    this.pub = initRedisClient(redisConfig);
  }

  public publish(channel: string, message: string) {
    return this.pub.publish(channel, message);
  }

  public subscribe(channel: string, callback: (channel: string, message: string) => void) {
    this.sub.subscribe(channel);
    this.sub.on('message', callback);
  }
}
