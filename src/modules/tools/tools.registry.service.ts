import { logger } from '@/common/logger';
import { enumToList, isValidNamespace } from '@/common/utils';
import { ExtendedToolDefinition } from '@/common/utils/define-tool';
import { SYSTEM_NAMESPACE } from '@/database/entities/tools/tools-server.entity';
import { ComfyuiRepository } from '@/database/repositories/comfyui.repository';
import { TriggerTypeRepository } from '@/database/repositories/trigger-type.repository';
import { BlockDefinition } from '@inf-monkeys/vines';
import { Injectable } from '@nestjs/common';
import { OpenAPIObject } from '@nestjs/swagger';
import { ServerObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import url from 'url';
import {
  ApiType,
  AuthType,
  CredentialEndpointConfig,
  CredentialEndpointType,
  ManifestJson,
  RegisterToolParams,
  SchemaVersion,
  ToolImportType,
  TriggerEndpointConfig,
  TriggerEndpointType,
} from '../../common/typings/tools';
import { CredentialsRepository } from '../../database/repositories/credential.repository';
import { ToolsRepository } from '../../database/repositories/tools.repository';
import { COMFYUI_NAMESPACE, COMFYUI_TOOL } from './comfyui/comfyui.execution.controller';
import { OpenAPIParserOptions, parseOpenApiSpecAsTools } from './utils/openapi-parser';

@Injectable()
export class ToolsRegistryService {
  constructor(
    private readonly toolsRepository: ToolsRepository,
    private readonly comfyuiWorkflowRepository: ComfyuiRepository,
    private readonly credentialsRepository: CredentialsRepository,
    private readonly triggerTypesRepository: TriggerTypeRepository,
  ) {}

  private async validateManifestJson(data: ManifestJson) {
    if (!data) {
      throw new Error('Error import tool: manifest data is empty');
    }
    if (!data.display_name) {
      throw new Error('Error import tool: display_name is missing');
    }
    if (!data.schema_version) {
      throw new Error('Error import tool: schema_version is missing');
    }
    if (!enumToList(SchemaVersion).includes(data.schema_version)) {
      throw new Error(`Error import tool: invalid schema_version "${data.schema_version}", must in any one of ${enumToList(SchemaVersion).join(',')}`);
    }
    if (!data.namespace) {
      throw new Error('Error import tool: namespace is missing');
    }
    const reservedNamespace = [SYSTEM_NAMESPACE];
    if (reservedNamespace.includes(data.namespace)) {
      throw new Error(`Error import tool: namespace is can not use reserved word: ${data.namespace}`);
    }

    if (!isValidNamespace(data.namespace)) {
      throw new Error(`Error import tool: for namespace, only numbers, letters, and underscores are allowed, and two consecutive underscores are not permitted.`);
    }

    if (!data.auth) {
      throw new Error('Error import tool: auth is missing');
    }
    if (!enumToList(AuthType).includes(data.auth.type)) {
      throw new Error(`Error import tool: invalid auth.type "${data.auth.type}", must in any one of ${enumToList(AuthType).join(',')}`);
    }
    if (!data.api) {
      throw new Error('Error import tool: api is missing');
    }
    if (!enumToList(ApiType).includes(data.api.type)) {
      throw new Error(`Error import tool: invalid api.type "${data.api.type}", must in any one of ${enumToList(ApiType).join(',')}`);
    }
    if (!data.api.url) {
      throw new Error('Error import tool: api.url is missing');
    }
    if (data.triggers?.length) {
      this.validateTriggerEndpoints(data.triggerEndpoints);
    }
    if (data.credentials?.length) {
      this.validateCredentialEndpoints(data.credentialEndpoints);
    }
    if (data.logEndpoint) {
      if (!data.logEndpoint.includes('{taskId}')) {
        throw new Error('Error import tool: logEndpoint must include {taskId}');
      }
    }
  }

  private validateTriggerEndpoints(triggerEndpoints: TriggerEndpointConfig[]) {
    if (!Array.isArray(triggerEndpoints)) {
      throw new Error('Error import tool: triggerEndpoints is missing');
    }
    const types: TriggerEndpointType[] = [TriggerEndpointType.create, TriggerEndpointType.delete, TriggerEndpointType.update];
    for (const type of types) {
      const config = triggerEndpoints.find((x) => x.type === type);
      if (!config) {
        throw new Error(`Error import tool: triggerEndpoint ${type} is missing`);
      }
      const { url, method } = config;
      if (!url) {
        throw new Error(`Error import tool: triggerEndpoint ${type} url is missing`);
      }
      if (!method) {
        throw new Error(`Error import tool: triggerEndpoint ${type} method is missing`);
      }
    }
  }

  private validateCredentialEndpoints(credentialEndpoints: CredentialEndpointConfig[]) {
    if (!Array.isArray(credentialEndpoints)) {
      throw new Error('Error import tool: credentialEndpoints is missing');
    }
    const types: CredentialEndpointType[] = [CredentialEndpointType.create, CredentialEndpointType.delete, CredentialEndpointType.update];
    for (const type of types) {
      const config = credentialEndpoints.find((x) => x.type === type);
      if (!config) {
        throw new Error(`Error import tool: credentialEndpoint ${type} is missing`);
      }
      const { url, method } = config;
      if (!url) {
        throw new Error(`Error import tool: credentialEndpoint ${type} url is missing`);
      }
      if (!method) {
        throw new Error(`Error import tool: credentialEndpoint ${type} method is missing`);
      }
    }
  }

  private async parseOpenapiAsTools(
    namespace: string,
    specUrl: string,
    options?: OpenAPIParserOptions,
  ): Promise<{
    servers: ServerObject[];
    tools: BlockDefinition[];
  }> {
    const { data: specData } = await axios.get<OpenAPIObject>(specUrl);
    const tools = parseOpenApiSpecAsTools(namespace, specData, options);
    return {
      servers: specData.servers,
      tools,
    };
  }

  private async validateToolsParsed(tools: BlockDefinition[]) {
    // Check if have duplicate tool
    const toolNames = tools.map((x) => x.name);
    const duplicateToolNames = toolNames.filter((x, i) => toolNames.indexOf(x) !== i);
    if (duplicateToolNames.length) {
      throw new Error(`Error when import block: duplicate tool names: ${duplicateToolNames.join(',')}`);
    }
  }

  private async registerToolsServerByManifest(manifestUrl: string) {
    const { data: manifestData } = await axios.get<ManifestJson>(manifestUrl);
    await this.validateManifestJson(manifestData);

    const {
      api: { url: specUrl, type: apiType },
      namespace,
      display_name,
    } = manifestData;

    let realSpecUrl = specUrl;
    let baseUrl: string;
    if (!realSpecUrl.startsWith('http://') && !realSpecUrl.startsWith('https://')) {
      const parsedUrl = url.parse(manifestUrl);
      baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
      realSpecUrl = url.resolve(baseUrl, realSpecUrl);
    } else {
      const parsedUrl = url.parse(realSpecUrl);
      baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
    }

    let tools: BlockDefinition[] = [];
    switch (apiType) {
      case ApiType.openapi:
        const res = await this.parseOpenapiAsTools(namespace, realSpecUrl);
        await this.validateToolsParsed(res.tools);
        tools = res.tools;
        break;
      default:
        throw new Error(`Error when import block: invalid api.type "${apiType}", must in any one of ${enumToList(ApiType).join(',')}`);
    }

    // Save server info and credentials
    await this.toolsRepository.saveServer(display_name, manifestUrl, baseUrl, manifestData);
    if (manifestData.credentials) {
      await this.credentialsRepository.createOrUpdateCredentialTypes(namespace, manifestData.credentials);
    }
    if (manifestData.triggers) {
      await this.triggerTypesRepository.createOrUpdateTriggerTypes(namespace, manifestData.triggers);
    }

    await this.toolsRepository.createOrUpdateTools(namespace, tools);
    return tools;
  }

  private async regsieterToolsServerByOpenapiSpec(namespace: string, openapiSpecUrl: string) {
    const { tools } = await this.parseOpenapiAsTools(namespace, openapiSpecUrl, {
      filterByXMonkeyToolNameTag: false,
    });
    await this.validateToolsParsed(tools);

    await this.toolsRepository.createOrUpdateTools(namespace, tools);
    return tools;
  }

  public async registerToolsServer(params: RegisterToolParams) {
    const { importType } = params;
    if (importType === ToolImportType.manifest) {
      const { manifestUrl } = params;
      return await this.registerToolsServerByManifest(manifestUrl);
    } else if (importType === ToolImportType.openapiSpec) {
      const { namespace, openapiSpecUrl } = params;
      return await this.regsieterToolsServerByOpenapiSpec(namespace, openapiSpecUrl);
    } else {
      throw new Error(`Error when import block: invalid importType "${importType}", must in any one of ${enumToList(ToolImportType).join(',')}`);
    }
  }

  public async getBuiltInTools(): Promise<ExtendedToolDefinition[]> {
    const folder = path.resolve(__dirname, `./conductor-system-tools/`);
    if (!fs.existsSync(folder)) {
      logger.warn('Bulit in tools folder not found');
    }
    const builtInTools: ExtendedToolDefinition[] = (
      await Promise.all(
        fs.readdirSync(folder, { withFileTypes: true }).reduce(
          (result, file) => {
            if (file.isDirectory()) return result;
            if (!file.name.endsWith('.js')) return result;
            result.push(import(path.resolve(folder, file.name)));
            return result;
          },
          [] as Promise<{ default: any }>[],
        ),
      )
    ).map((x) => x.default);
    return builtInTools;
  }

  public async isBuiltInTool(toolName: string) {
    const tools = await this.getBuiltInTools();
    return tools.find((tool) => tool.name === toolName);
  }

  public async initBuiltInTools() {
    const builtInTools = await this.getBuiltInTools();
    await this.toolsRepository.createOrUpdateTools(
      SYSTEM_NAMESPACE,
      builtInTools.filter((x) => !x.hidden),
    );
  }

  public async listTools(teamId: string) {
    const tools = await this.toolsRepository.listTools();
    // Handle Special comfyui tool
    const comfyuiInferTool = tools.find((x) => x.name === `${COMFYUI_NAMESPACE}:${COMFYUI_TOOL}`);
    if (comfyuiInferTool) {
      const comfyuiWorkflowsInThisTeam = await this.comfyuiWorkflowRepository.getAllComfyuiWorkflows(teamId);
      let input = comfyuiInferTool.input || [];
      for (const comfyuiWorkflow of comfyuiWorkflowsInThisTeam) {
        try {
          if (comfyuiWorkflow.toolInput?.length) {
            input = input.concat(
              comfyuiWorkflow.toolInput.map((item) => {
                item.displayOptions = item.displayOptions || {};
                item.displayOptions.show = item.displayOptions.show || {};
                item.displayOptions.show.workflow = [comfyuiWorkflow.id];
                return item;
              }),
            );
          }
        } catch (error) {
          logger.error('Error when handle comfyui workflow', error);
        }
      }
      comfyuiInferTool.input = input;
    }
    return tools;
  }

  public async getToolByName(name: string) {
    return await this.toolsRepository.getToolByName(name);
  }
}
