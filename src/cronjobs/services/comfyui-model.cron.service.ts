import { LOCK_TOKEN } from '@/common/common.module';
import { config } from '@/common/config';
import { logger } from '@/common/logger';
import { LockManager } from '@/common/utils/lock';
import { ComfyuiModelService } from '@/modules/assets/comfyui-model/comfyui-model.service';
import { ComfyUIService } from '@/modules/tools/comfyui/comfyui.service';
import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
@Injectable()
export class ComfyuiModelCronService {
  private readonly lockResource = `${config.server.appId}:cron:lock:comfyui-model`;

  constructor(
    @Inject(LOCK_TOKEN) private readonly lockManager: LockManager,
    private readonly modelService: ComfyuiModelService,
    private readonly comfyuiService: ComfyUIService,
  ) {}

  public async updateModelsGlobal() {
    const rawServerList = await this.comfyuiService.listAllServers();

    rawServerList.forEach(async (server) => {
      try {
        await this.modelService.updateModelsByTeamIdAndServerId(server.teamId, server.id);
      } catch (error) {
        logger.error(`Comfyui-model cronjob has some errors: ${server.id} can't connect. Raw error message: ${error}`);
      }
    });
  }

  @Cron(config.comfyui.refreshCron)
  public async runScheduler() {
    if (!config.cron.enabled) return;
    const identifier = await this.lockManager.acquireLock(this.lockResource);
    if (identifier) {
      // 成功获取到锁，执行需要加锁的代码
      try {
        await this.updateModelsGlobal();
        logger.info('Comfyui-model cronjob finished');
      } finally {
        // 释放锁
        await this.lockManager.releaseLock(this.lockResource, identifier);
      }
    } else {
      // logger.log('获取不到锁');
    }
  }
}
