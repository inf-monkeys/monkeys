import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { config } from './common/config';
import { logger } from './common/logger';
import { EXAMPLE_WORKER_OPENAPI_MENIFEST_URL } from './modules/worker/example/example.swagger';
import { WorkerRegistryService } from './modules/worker/worker.registry.service';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  constructor(private readonly workerRegistryService: WorkerRegistryService) {}

  onApplicationBootstrap() {
    if (config.server.loadExample) {
      logger.info(`Load example blocks of ${EXAMPLE_WORKER_OPENAPI_MENIFEST_URL}`);
      this.workerRegistryService.registerBlocks({
        menifestJsonUrl: EXAMPLE_WORKER_OPENAPI_MENIFEST_URL,
      });
    }
  }
}
