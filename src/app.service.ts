import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { OpenAPIObject } from '@nestjs/swagger';
import axios from 'axios';
import { config } from './common/config';
import { logger } from './common/logger';
import { sleep } from './common/utils/utils';
import { ToolsRepository } from './database/repositories/tools.repository';
import { BUILTIN_TOOL_OPENAPI_MENIFEST_URL } from './modules/tools/builtin/builtin.swagger';
import { EXAMPLE_WORKER_OPENAPI_MENIFEST_URL } from './modules/tools/example/example.swagger';
import { ToolsRegistryService } from './modules/tools/tools.registry.service';
@Injectable()
export class AppService implements OnApplicationBootstrap {
  constructor(
    private readonly workerRegistryService: ToolsRegistryService,
    private readonly toolsRepository: ToolsRepository,
  ) {}

  public async getCombinedToolsSwagger() {
    const servers = await this.toolsRepository.listServers();
    const result = await Promise.all(
      servers.map(async (server) => {
        const specUrl = server.getSpecUrl();
        try {
          const { data: specData } = await axios.get<OpenAPIObject>(specUrl);
          return {
            namespace: server.namespace,
            displayName: server.displayName,
            spec: specData,
          };
        } catch (error) {}
      }),
    );
    return result.filter(Boolean);
  }

  private async waitServerHttpServiceAvailable() {
    while (true) {
      try {
        await axios.get('/api/healthz', {
          baseURL: `http://127.0.0.1:${config.server.port}`,
        });
        break;
      } catch (error) {
        await sleep(200);
      }
    }
  }

  private async registerTools() {
    await this.waitServerHttpServiceAvailable();
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
  }
}
