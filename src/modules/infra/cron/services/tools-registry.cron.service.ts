import { config } from '@/common/config';
import { logger } from '@/common/logger';
import { LockManager } from '@/common/utils/lock';
import { ToolsRegistryService } from '@/modules/tools/tools.registry.service';
import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ToolsRepository } from '../../../../repositories/tools.repository';

@Injectable()
export class ToolsRegistryCronService {
  private readonly lockResource = 'tools-registry-cron';

  constructor(
    @Inject('LOCK') private readonly lockManager: LockManager,
    private readonly toolsRegistryService: ToolsRegistryService,
    private readonly toolsRepository: ToolsRepository,
  ) {}

  @Cron('* * * * *')
  public async runScheduler() {
    if (!config.cron.enabled) {
      return;
    }
    const identifier = await this.lockManager.acquireLock(this.lockResource);
    if (identifier) {
      // 成功获取到锁，执行需要加锁的代码

      try {
        logger.info('Start to refresh tools');
        const registries = await this.toolsRepository.listRegistries();
        for (const registry of registries) {
          await this.toolsRegistryService.registerToolsServer({
            manifestUrl: registry.manifestUrl,
          });
        }
        logger.info('Refresh tools succeed');
      } catch (error) {
        logger.info('Refresh tools failed', error.message);
      } finally {
        // 释放锁
        await this.lockManager.releaseLock(this.lockResource, identifier);
      }
    } else {
      // logger.log('获取不到锁');
    }
  }
}