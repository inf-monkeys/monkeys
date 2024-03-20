import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { config } from './common/config';
import { logger } from './common/logger';
import { BUILTIN_TOOL_OPENAPI_MENIFEST_URL } from './modules/tools/builtin/builtin.swagger';
import { EXAMPLE_WORKER_OPENAPI_MENIFEST_URL } from './modules/tools/example/example.swagger';
import { ToolsRegistryService } from './modules/tools/tools.registry.service';
import { ComfyuiRepository } from './repositories/comfyui.repository';
import { TeamRepository } from './repositories/team.repository';
import { UserRepository } from './repositories/user.repository';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  constructor(
    private readonly workerRegistryService: ToolsRegistryService,
    private readonly comfyuiRepository: ComfyuiRepository,
    private readonly userRepository: UserRepository,
    private readonly teamRepository: TeamRepository,
  ) {}

  private registerTools() {
    logger.info(`Load builtin tools of ${BUILTIN_TOOL_OPENAPI_MENIFEST_URL}`);
    this.workerRegistryService.registerToolsServer({
      manifestUrl: BUILTIN_TOOL_OPENAPI_MENIFEST_URL,
    });
    if (config.server.loadExample) {
      logger.info(`Load example tools of ${EXAMPLE_WORKER_OPENAPI_MENIFEST_URL}`);
      this.workerRegistryService.registerToolsServer({
        manifestUrl: EXAMPLE_WORKER_OPENAPI_MENIFEST_URL,
      });
    }

    for (const { name, manifestUrl } of config.tools) {
      logger.info(`Load ${name} tools of ${manifestUrl}`);
      this.workerRegistryService
        .registerToolsServer({
          manifestUrl: manifestUrl,
        })
        .catch((error) => {
          logger.warn(`Load tool ${name}(${manifestUrl}) failed: ${error.message}`);
        });
    }
  }

  onApplicationBootstrap() {
    this.registerTools();
    this.comfyuiRepository.createOrUpdateDefaultServer();
  }
}
