import { LOCK_TOKEN } from '@/common/common.module';
import { config } from '@/common/config';
import { logger } from '@/common/logger';
import { ToolImportType } from '@/common/typings/tools';
import { LockManager } from '@/common/utils/lock';
import { ToolsRegistryService } from '@/modules/tools/tools.registry.service';
import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ToolsRepository } from '../../database/repositories/tools.repository';

@Injectable()
export class ToolsRegistryCronService {
  private readonly lockResource = 'tools-registry-cron';

  constructor(
    @Inject(LOCK_TOKEN) private readonly lockManager: LockManager,
    private readonly toolsRegistryService: ToolsRegistryService,
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
        const registries = await this.toolsRepository.listServers();
        for (const registry of registries) {
          try {
            await this.toolsRegistryService.registerToolsServer({
              importType: ToolImportType.manifest,
              manifestUrl: registry.manifestUrl,
            });
          } catch (error) {
            logger.info(`Refresh tools ${registry.namespace} failed`, error.message);
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
