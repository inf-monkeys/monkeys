import { Injectable } from '@nestjs/common';
import { SystemConfigurationRepository } from '../../repositories/system-configuration.repository';
import { ToolsRegistryService } from '../tools/tools.registry.service';

@Injectable()
export class BootstrapService {
  constructor(
    private readonly toolsRegistryService: ToolsRegistryService,
    private readonly systemConfigurationRepository: SystemConfigurationRepository,
  ) {}

  public async bootstrap() {
    // Register built in tools
    this.toolsRegistryService.initBuiltInTools();
    await this.systemConfigurationRepository.initAesKey();
  }
}
