import { Injectable } from '@nestjs/common';
import { SystemConfigurationRepository } from '@/database/repositories/system-configuration.repository';
import { AssetsMarketplaceService } from '../assets/assets.marketplace.service';
import { ToolsRegistryService } from '../tools/tools.registry.service';

@Injectable()
export class BootstrapService {
  constructor(
    private readonly toolsRegistryService: ToolsRegistryService,
    private readonly systemConfigurationRepository: SystemConfigurationRepository,
    private readonly marketplaceService: AssetsMarketplaceService,
  ) {}

  public async bootstrap() {
    // Register built in tools
    await this.toolsRegistryService.initBuiltInTools();
    await this.systemConfigurationRepository.initAesKey();
    await this.systemConfigurationRepository.initOneApiRootUserToken();
    await this.marketplaceService.initBuiltInMarketplace();
  }
}
