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
  private readonly lockResource = `${config.server.appId}:cron:lock:tools-registry`;

  constructor(
    @Inject(LOCK_TOKEN) private readonly lockManager: LockManager,
    private readonly toolsRegistryService: ToolsRegistryService,
    private readonly toolsRepository: ToolsRepository,
  ) {}

  @Cron('*/5 * * * * *')  // 每5秒执行一次
  public async runScheduler() {
    if (!config.cron.enabled) {
      return;
    }

    const startTime = Date.now();
    const identifier = await this.lockManager.acquireLock(this.lockResource);

    if (identifier) {
      // 成功获取到锁，执行需要加锁的代码
      try {
        logger.info('[ToolsRegistry Cron] Starting tools refresh...');

        // 注册所有工具服务器
        const registries = await this.toolsRepository.listServers();
        logger.info(`[ToolsRegistry Cron] Found ${registries.length} tool servers to refresh`);

        let successCount = 0;
        let failCount = 0;

        // ✅ 串行执行，避免并发过多
        for (const registry of registries) {
          try {
            await this.toolsRegistryService.registerToolsServer({
              importType: ToolImportType.manifest,
              manifestUrl: registry.manifestUrl,
            });
            successCount++;
            logger.debug(`[ToolsRegistry Cron] Refreshed tools for ${registry.namespace}`);
          } catch (error) {
            failCount++;
            logger.warn(`[ToolsRegistry Cron] Refresh tools ${registry.namespace} failed: ${error.message}`);
          }
        }

        // 注册配置文件中的外部工具
        for (const { name, manifestUrl } of config.tools) {
          try {
            await this.toolsRegistryService.registerToolsServer(
              {
                importType: ToolImportType.manifest,
                manifestUrl: manifestUrl,
              },
              {
                isPublic: true,
              },
            );
            successCount++;
            logger.debug(`[ToolsRegistry Cron] Refreshed external tool ${name}`);
          } catch (error) {
            failCount++;
            logger.warn(`[ToolsRegistry Cron] Load tool ${name}(${manifestUrl}) failed: ${error.message}`);
          }
        }

        const duration = Date.now() - startTime;
        logger.info(
          `[ToolsRegistry Cron] Completed. Success: ${successCount}, Failed: ${failCount}, Duration: ${duration}ms`
        );
      } catch (error) {
        logger.error(`[ToolsRegistry Cron] Fatal error:`, error);
      } finally {
        // 释放锁
        await this.lockManager.releaseLock(this.lockResource, identifier);
      }
    } else {
      logger.debug('[ToolsRegistry Cron] Could not acquire lock, skipping this run');
    }
  }
}
