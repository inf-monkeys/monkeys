import { config } from '@/common/config';
import { logger } from '@/common/logger';
import { BuiltInMarket } from '@/common/typings/asset';
import { generateDbId } from '@/common/utils';
import { getI18NValue } from '@/common/utils/i18n';
import { UserEntity } from '@/database/entities/identity/user';
import { MarketplaceAppVersionEntity, MarketplaceAppVersionStatus } from '@/database/entities/marketplace/marketplace-app-version.entity';
import { MarketplaceAppEntity, MarketplaceAppStatus } from '@/database/entities/marketplace/marketplace-app.entity';
import { SystemConfigurationRepository } from '@/database/repositories/system-configuration.repository';
import { UserRepository } from '@/database/repositories/user.repository';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import fs from 'fs';
import path from 'path';
import { EntityManager, Repository } from 'typeorm';
import { AssetsMarketplaceService } from '../assets/assets.marketplace.service';
import { INTERNAL_BUILT_IN_MARKET } from '../assets/consts';
import { PasswordService } from '../auth/password/password.service';
import { LLM_CHAT_COMPLETION_TOOL, LLM_COMPLETION_TOOL, LLM_NAMESPACE } from '../tools/llm/llm.controller';
import { ToolsRegistryService } from '../tools/tools.registry.service';

@Injectable()
export class BootstrapService {
  constructor(
    private readonly toolsRegistryService: ToolsRegistryService,
    private readonly systemConfigurationRepository: SystemConfigurationRepository,
    private readonly marketplaceService: AssetsMarketplaceService,
    private readonly eventEmitter: EventEmitter2,
    private readonly entityManager: EntityManager,
    @InjectRepository(MarketplaceAppEntity) private readonly appRepo: Repository<MarketplaceAppEntity>,
    @InjectRepository(MarketplaceAppVersionEntity) private readonly versionRepo: Repository<MarketplaceAppVersionEntity>,
    private readonly passwordService: PasswordService,
    private readonly userRepo: UserRepository,
  ) {}

  /**
   * 加载并处理内置市场数据
   * @private
   */
  private async _loadAndProcessMarketData(): Promise<BuiltInMarket> {
    let rawBuiltInMarketList = [];
    if (process.env.MONKEYS_BUILT_IN_MARKET_FILE) {
      rawBuiltInMarketList = [path.resolve(process.env.MONKEYS_BUILT_IN_MARKET_FILE)];
    } else {
      const appBuiltInMarketFileList = [path.resolve(`/etc/monkeys/builtInMarket.${config.server.appId}.json`), path.resolve(`./builtInMarket.${config.server.appId}.json`)];
      rawBuiltInMarketList = appBuiltInMarketFileList.some(fs.existsSync) ? appBuiltInMarketFileList : [path.resolve('/etc/monkeys/builtInMarket.json'), path.resolve('./builtInMarket.json')];
    }

    rawBuiltInMarketList = rawBuiltInMarketList
      .filter(Boolean)
      .filter(fs.existsSync)
      .map((file) => fs.readFileSync(file, 'utf-8'));

    rawBuiltInMarketList.push(JSON.stringify(INTERNAL_BUILT_IN_MARKET));

    rawBuiltInMarketList = rawBuiltInMarketList
      .map((content) =>
        content
          .replace(/\{\{LLM_CHAT_COMPLETION_TOOL\}\}/g, LLM_CHAT_COMPLETION_TOOL)
          .replace(/\{\{LLM_COMPLETION_TOOL\}\}/g, LLM_COMPLETION_TOOL)
          .replace(/\{\{LLM_NAMESPACE\}\}/g, LLM_NAMESPACE),
      )
      .map((content) => JSON.parse(content));

    return rawBuiltInMarketList.reduce((acc, current) => {
      for (const key in current) {
        if (Array.isArray(current[key])) {
          acc[key] = acc[key] ? acc[key].concat(current[key]) : [...current[key]];
        } else {
          acc[key] = current[key];
        }
      }
      return acc;
    }, {}) as BuiltInMarket;
  }

  private async syncPresetMarketplaceApps(marketData: BuiltInMarket) {
    const presetApps = marketData.workflows;
    if (!presetApps || presetApps.length === 0) {
      logger.info('No preset apps found to sync.');
      return;
    }

    try {
      for (const presetApp of presetApps) {
        await this.entityManager.transaction(async (transactionalEntityManager) => {
          const versionExists = await transactionalEntityManager.findOne(MarketplaceAppVersionEntity, {
            where: { appId: presetApp.id, version: String(presetApp.version) },
          });

          if (versionExists) {
            return;
          }

          logger.info(`Syncing preset marketplace app: ${getI18NValue(presetApp.displayName)} v${presetApp.version}`);

          let app = await transactionalEntityManager.findOne(MarketplaceAppEntity, { where: { id: presetApp.id } });

          if (!app) {
            app = transactionalEntityManager.create(MarketplaceAppEntity, {
              id: presetApp.id,
              name: getI18NValue(presetApp.displayName) as string,
              description: (getI18NValue(presetApp.description) as string) || '',
              iconUrl: presetApp.iconUrl,
              assetType: 'workflow',
              authorTeamId: 'system',
              status: MarketplaceAppStatus.APPROVED,
              categories: presetApp.tags,
            });
            await transactionalEntityManager.save(app);
          }

          const newVersionToCreate = new MarketplaceAppVersionEntity();
          newVersionToCreate.id = generateDbId();
          newVersionToCreate.appId = app.id;
          newVersionToCreate.version = String(presetApp.version);
          newVersionToCreate.releaseNotes = 'Preset application version.';
          newVersionToCreate.status = MarketplaceAppVersionStatus.ACTIVE;

          newVersionToCreate.assetSnapshot = {
            [app.assetType]: [presetApp],
          };

          newVersionToCreate.sourceAssetReferences = [];

          const newVersion = await transactionalEntityManager.save(newVersionToCreate);

          this.eventEmitter.emit('marketplace.app.version.approved', {
            appId: app.id,
            newVersionId: newVersion.id,
          });
        });
      }
    } catch (error) {
      logger.error('Failed to sync preset marketplace apps.', error.stack);
    }
  }

  private async upsertInitialAdmin() {
    if (!config.admin || !config.admin.email) {
      return;
    }

    const { password, email, username } = config.admin;
    const finalUsername = username || email.split('@')[0];
    let adminUser = await this.userRepo.findByEmail(email);

    if (!adminUser) {
      const encryptedPassword = this.passwordService.encryptPassword(password);
      adminUser = await this.userRepo.registerUser({
        email,
        name: finalUsername,
        password: encryptedPassword,
      });
      logger.info(`Initial admin user ${finalUsername} not found, creating a new one.`);
    } else {
      logger.info(`Initial admin user ${finalUsername} found, updating.`);
    }

    const userToUpdate: Partial<UserEntity> = {
      isAdmin: true,
    };
    if (password) {
      userToUpdate.password = this.passwordService.encryptPassword(password);
    }
    await this.userRepo.updateUser(adminUser.id, userToUpdate);
    logger.info(`Initial admin user ${finalUsername} has been upserted.`);
  }

  public async bootstrap() {
    logger.info('Starting system bootstrap process...');

    try {
      logger.info('Initializing built-in tools...');
      await this.toolsRegistryService.initBuiltInTools();
      logger.info('Built-in tools initialized successfully.');

      logger.info('Initializing AES key...');
      await this.systemConfigurationRepository.initAesKey();
      logger.info('AES key initialized successfully.');

      logger.info('Initializing OneAPI root user token...');
      await this.systemConfigurationRepository.initOneApiRootUserToken();
      logger.info('OneAPI root user token initialized successfully.');

      const marketData = await this._loadAndProcessMarketData();

      logger.info('Initializing built-in marketplace (assets)...');
      await this.marketplaceService.initBuiltInMarketplace();
      logger.info('Built-in marketplace (assets) initialized successfully.');

      logger.info('Syncing preset marketplace apps (independent)...');
      await this.syncPresetMarketplaceApps(marketData);
      logger.info('Preset marketplace apps (independent) synced successfully.');

      logger.info('Upserting initial admin user...');
      await this.upsertInitialAdmin();
      logger.info('Initial admin user upserted successfully.');

      logger.info('System bootstrap process completed successfully.');
    } catch (error) {
      logger.error('An error occurred during the bootstrap process:', error.stack);
    }
  }
}
