import { LOCK_TOKEN } from '@/common/common.module';
import { config } from '@/common/config';
import { logger } from '@/common/logger';
import { LockManager } from '@/common/utils/lock';
import { HealthCheckStatus } from '@/database/entities/tools/tools-server.entity';
import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { ToolsRepository } from '../../database/repositories/tools.repository';

@Injectable()
export class ToolsHealthCheckCronService {
  private readonly lockResource = 'tools-health-check-cron';

  constructor(
    @Inject(LOCK_TOKEN) private readonly lockManager: LockManager,
    private readonly toolsRepository: ToolsRepository,
  ) {}

  @Cron('*/5 * * * * *')
  public async runScheduler() {
    if (!config.cron.enabled) {
      return;
    }
    const identifier = await this.lockManager.acquireLock(this.lockResource);
    if (identifier) {
      // 成功获取到锁，执行需要加锁的代码
      try {
        const registries = await this.toolsRepository.listServerHasHealthCheckEndpoint();
        for (const registry of registries) {
          try {
            const healthCheckUrl = registry.getHealthCheckUrl();
            await axios.get(healthCheckUrl);
            await this.toolsRepository.updateToolServer(registry.namespace, { healthCheckStatus: HealthCheckStatus.UP });
          } catch (error) {
            logger.info(`Tools ${registry.namespace} health check failed`, error.message);
            await this.toolsRepository.updateToolServer(registry.namespace, { healthCheckStatus: HealthCheckStatus.DOWN });
          }
        }
      } finally {
        // 释放锁
        await this.lockManager.releaseLock(this.lockResource, identifier);
      }
    } else {
      // logger.log('获取不到锁');
    }
  }
}
