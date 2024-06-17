import { EventEmitter } from 'events';
import Redis, { Cluster } from 'ioredis';
import { RedisConfig } from '../config';
import { initRedisClient } from '../redis';

export interface Mq {
  subscribe(channel: string, callback: (channel: string, message: string) => void): void;
  publish(channel: string, message: string): Promise<void>;
}

class ChatMessageEventEmitter extends EventEmitter {}

export class EventEmitterMq implements Mq {
  emitter: ChatMessageEventEmitter;

  constructor() {
    this.emitter = new ChatMessageEventEmitter();
  }

  public async publish(channel: string, message: string) {
    this.emitter.emit(channel, message);
  }

  public subscribe(channel: string, callback: (channel: string, message: string) => void) {
    this.emitter.on(channel, (data: string) => {
      callback(channel, data);
    });
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

  public async publish(channel: string, message: string) {
    await this.pub.publish(channel, message);
  }

  public subscribe(channel: string, callback: (channel: string, message: string) => void) {
    this.sub.subscribe(channel);
    this.sub.on('message', callback);
  }
}
