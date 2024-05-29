import { LOCK_TOKEN } from '@/common/common.module';
import { config } from '@/common/config';
import { logger } from '@/common/logger';
import { ComfyfileApp, parseComfyfile } from '@/common/utils/comfyfile';
import { downloadGitHubDirectory, getGithubSubdirectories } from '@/common/utils/github';
import { LockManager } from '@/common/utils/lock';
import { ComfyuiWorkflowSourceType } from '@/database/entities/comfyui/comfyui-workflow.entity';
import { ComfyuiWorkflowAssetRepositroy } from '@/database/repositories/assets-comfyui-workflow.respository';
import { AssetsCommonRepository } from '@/database/repositories/assets-common.repository';
import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import fs from 'fs';
import _ from 'lodash';
import os from 'os';
import path from 'path';

@Injectable()
export class ComfyfileCronService {
  private readonly lockResource = 'comfyfile-cron';

  constructor(
    @Inject(LOCK_TOKEN) private readonly lockManager: LockManager,
    private readonly comfyuiWorkflowAssetRepository: ComfyuiWorkflowAssetRepositroy,
    private readonly assetsCommonRepository: AssetsCommonRepository,
  ) {}

  private async saveComfyfileApp(subdirectory: string, app: ComfyfileApp) {
    const tags = app.tags;
    await this.comfyuiWorkflowAssetRepository.initBuiltInMarketPlace('comfyui-workflow', {
      isPreset: true,
      isPublished: true,
      id: app.appName,
      iconUrl: 'emoji:📷:#98ae36',
      displayName: app.displayName,
      description: app.description,
      workflowType: ComfyuiWorkflowSourceType.Comfyfile,
      workflow: app.workflow,
      prompt: app.workflowApi,
      toolInput: app.restEndpoint?.parameters || [],
      originalData: {
        homepage: app.homepage,
        comfyfileRepo: `${config.comfyui.comfyfileRepo}/${subdirectory}`,
      },
    });
    if (tags.length > 0) {
      await this.assetsCommonRepository.createMarketplaceTagBatch('comfyui-workflow', tags);
    }
  }

  private async processSubdirectory(subdirectory: string) {
    const tmpDir = path.join(os.homedir(), '.cache', 'Comfyfile', 'tmp', subdirectory);
    await downloadGitHubDirectory(`${config.comfyui.comfyfileRepo}/${subdirectory}`, tmpDir);
    const comfyfilePath = path.join(tmpDir, 'Comfyfile');
    if (!fs.existsSync(comfyfilePath)) {
      return;
    }
    const comfyfileApps = parseComfyfile(comfyfilePath, tmpDir);
    for (const app of comfyfileApps) {
      await this.saveComfyfileApp(subdirectory, app);
    }
  }

  @Cron(config.comfyui.refreshCron)
  public async runScheduler() {
    if (!config.cron.enabled) {
      return;
    }
    const identifier = await this.lockManager.acquireLock(this.lockResource);
    if (identifier) {
      // 成功获取到锁，执行需要加锁的代码
      try {
        const subdirectories = await getGithubSubdirectories(config.comfyui.comfyfileRepo);
        const chunks = _.chunk(subdirectories, 10);
        for (const chunk of chunks) {
          await Promise.all(chunk.map((subdirectory) => this.processSubdirectory(subdirectory)));
        }
        logger.info('Comfyfile cronjob finished');
      } finally {
        // 释放锁
        await this.lockManager.releaseLock(this.lockResource, identifier);
      }
    } else {
      // logger.log('获取不到锁');
    }
  }
}
