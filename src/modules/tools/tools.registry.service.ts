import { logger } from '@/common/logger';
import { enumToList, isValidNamespace } from '@/common/utils';
import { SYSTEM_NAMESPACE } from '@/database/entities/tools/tools-server.entity';
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
  RegisterWorkerParams,
  SchemaVersion,
  TriggerEndpointConfig,
  TriggerEndpointType,
} from '../../common/typings/tools';
import { CredentialsRepository } from '../../database/repositories/credential.repository';
import { ToolsRepository } from '../../database/repositories/tools.repository';
import { parseOpenApiSpecAsBlocks } from './utils/openapi-parser';

@Injectable()
export class ToolsRegistryService {
  constructor(
    private readonly toolsRepository: ToolsRepository,
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
    if (!data.contact_email) {
      throw new Error('Error import tool: contact_email is missing');
    }
    if (data.triggers?.length) {
      this.validateTriggerEndpoints(data.triggerEndpoints);
    }
    if (data.credentials?.length) {
      this.validateCredentialEndpoints(data.credentialEndpoints);
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

  private async parseOpenapiAsBlocks(
    namespace: string,
    specUrl: string,
  ): Promise<{
    servers: ServerObject[];
    blocks: BlockDefinition[];
  }> {
    const { data: specData } = await axios.get<OpenAPIObject>(specUrl);
    const blocks = parseOpenApiSpecAsBlocks(namespace, specData);
    return {
      servers: specData.servers,
      blocks,
    };
  }

  public async registerToolsServer(params: RegisterWorkerParams) {
    const { manifestUrl } = params;
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
        const res = await this.parseOpenapiAsBlocks(namespace, realSpecUrl);
        tools = res.blocks;
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

  public async initBuiltInTools() {
    const folder = path.resolve(__dirname, `./conductor-system-tools/`);
    if (!fs.existsSync(folder)) {
      logger.warn('Bulit in tools folder not found');
    }
    const builtInBlocks: BlockDefinition[] = (
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

    await this.toolsRepository.createOrUpdateTools(SYSTEM_NAMESPACE, builtInBlocks);
  }

  public async listTools() {
    return await this.toolsRepository.listTools();
  }

  public async getToolByName(name: string) {
    return await this.toolsRepository.getToolByName(name);
  }
}
