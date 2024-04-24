import Redis, { Cluster } from 'ioredis';
import { RedisConfig, RedisMode } from '../config';

export const initRedisClient = (config: RedisConfig): Redis | Cluster => {
  switch (config.mode) {
    case RedisMode.standalone:
      return new Redis(config.url, config.options);
    case RedisMode.cluster:
      return new Redis.Cluster(config.nodes, {
        redisOptions: config.options,
      });
    case RedisMode.sentinel:
      return new Redis({
        sentinels: config.sentinelNodes,
        name: config.sentinelName,
        ...config.options,
      });
    default:
      throw new Error(`Invalid Redis mode: ${config.mode}`);
  }
};
