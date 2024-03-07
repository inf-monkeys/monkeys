import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { config } from './common/config';
import { logger } from './common/logger';
import { EXAMPLE_WORKER_OPENAPI_MENIFEST_URL } from './modules/tools/example/example.swagger';
import { ToolsRegistryService } from './modules/tools/tools.registry.service';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  constructor(private readonly workerRegistryService: ToolsRegistryService) {}

  onApplicationBootstrap() {
    if (config.server.loadExample) {
      logger.info(`Load example blocks of ${EXAMPLE_WORKER_OPENAPI_MENIFEST_URL}`);
      this.workerRegistryService.registerToolsServer({
        manifestJsonUrl: EXAMPLE_WORKER_OPENAPI_MENIFEST_URL,
      });
    }
  }
}
