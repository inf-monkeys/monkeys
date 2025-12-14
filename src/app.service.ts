import { TRANSLATE_TOOL_OPENAPI_MANIFEST_URL } from '@/modules/tools/translate/translate.swagger';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { OpenAPIObject } from '@nestjs/swagger';
import axios from 'axios';
import { config } from './common/config';
import { logger } from './common/logger';
import { ToolImportType } from './common/typings/tools';
import { sleep } from './common/utils/utils';
import { ComfyuiRepository } from './database/repositories/comfyui.repository';
import { ToolsRepository } from './database/repositories/tools.repository';
import { COMFYUI_TOOL_OPENAPI_MENIFEST_URL } from './modules/tools/comfyui/comfyui.swagger';
import { EXAMPLE_TOOL_OPENAPI_MENIFEST_URL } from './modules/tools/example/example.swagger';
import { CHAT_TOOL_OPENAPI_MENIFEST_URL } from './modules/tools/llm/llm.swagger';
import { MEDIA_TOOL_OPENAPI_MANIFEST_URL } from './modules/tools/media/media.swagger';
import { ToolsRegistryService } from './modules/tools/tools.registry.service';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  constructor(
    private readonly toolsRegistryService: ToolsRegistryService,
    private readonly toolsRepository: ToolsRepository,
    private readonly comfyuiRepository: ComfyuiRepository,
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

    // ✅ 优化：使用数组管理所有工具，便于统一处理
    const builtInTools = [
      {
        name: 'example',
        url: EXAMPLE_TOOL_OPENAPI_MENIFEST_URL,
        enabled: config.server.loadExample
      },
      {
        name: 'chat',
        url: CHAT_TOOL_OPENAPI_MENIFEST_URL,
        enabled: true
      },
      {
        name: 'comfyui',
        url: COMFYUI_TOOL_OPENAPI_MENIFEST_URL,
        enabled: true
      },
      {
        name: 'translate',
        url: TRANSLATE_TOOL_OPENAPI_MANIFEST_URL,
        enabled: !!config?.aws?.translate
      },
      {
        name: 'media',
        url: MEDIA_TOOL_OPENAPI_MANIFEST_URL,
        enabled: true
      },
    ];

    // ✅ 串行注册内置工具，避免并发连接过多
    for (const tool of builtInTools) {
      if (!tool.enabled) continue;

      try {
        logger.info(`Loading ${tool.name} tool of ${tool.url}`);
        await this.toolsRegistryService.registerToolsServer(
          {
            importType: ToolImportType.manifest,
            manifestUrl: tool.url,
          },
          {
            isPublic: true,
          },
        );
      } catch (error) {
        logger.error(`Failed to register ${tool.name} tool: ${error.message}`);
      }
    }

    // ✅ 串行注册外部工具，避免并发连接过多
    for (const { name, manifestUrl } of config.tools) {
      try {
        logger.info(`Loading ${name} tools of ${manifestUrl}`);
        await this.toolsRegistryService.registerToolsServer(
          {
            importType: ToolImportType.manifest,
            manifestUrl: manifestUrl,
          },
          {
            isPublic: true,
          },
        );
      } catch (error) {
        logger.warn(`Load tool ${name}(${manifestUrl}) failed: ${error.message}`);
      }
    }
  }

  private async registerDrfaultComfyuiServer() {
    if (config.comfyui.defaultServer) {
      await this.comfyuiRepository.createDefaultServer(config.comfyui.defaultServer);
    }
  }

  onApplicationBootstrap() {
    this.registerTools();
    this.registerDrfaultComfyuiServer();
  }
}
