import { logger } from '@/common/logger';
import { enumToList } from '@/common/utils';
import { BlockDefinition } from '@inf-monkeys/vines';
import { Injectable } from '@nestjs/common';
import { OpenAPIObject } from '@nestjs/swagger';
import { ServerObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import url from 'url';
import { CredentialsRepository } from '../infra/database/repositories/credential.repository';
import { ToolsRepository } from '../infra/database/repositories/tools.repository';
import { ApiType, AuthType, ManifestJson, RegisterWorkerParams, SchemaVersion } from './interfaces';
import { parseOpenApiSpecAsBlocks } from './utils/openapi-parser';

@Injectable()
export class ToolsRegistryService {
  constructor(
    private readonly toolsRepository: ToolsRepository,
    private readonly credentialsRepository: CredentialsRepository,
  ) {}

  private async validateManifestJson(data: ManifestJson) {
    if (!data) {
      throw new Error('Error when parse manifest json: manifest data is empty');
    }
    if (!data.schema_version) {
      throw new Error('Error when parse manifest json: schema_version is missing');
    }
    if (!enumToList(SchemaVersion).includes(data.schema_version)) {
      throw new Error(`Error when parse manifest json: invalid schema_version "${data.schema_version}", must in any one of ${enumToList(SchemaVersion).join(',')}`);
    }
    if (!data.namespace) {
      throw new Error('Error when parse manifest json: namespace is missing');
    }

    if (!data.auth) {
      throw new Error('Error when parse manifest json: auth is missing');
    }
    if (!enumToList(AuthType).includes(data.auth.type)) {
      throw new Error(`Error when parse manifest json: invalid auth.type "${data.auth.type}", must in any one of ${enumToList(AuthType).join(',')}`);
    }
    if (!data.api) {
      throw new Error('Error when parse manifest json: api is missing');
    }
    if (!enumToList(ApiType).includes(data.api.type)) {
      throw new Error(`Error when parse manifest json: invalid api.type "${data.api.type}", must in any one of ${enumToList(ApiType).join(',')}`);
    }
    if (!data.api.url) {
      throw new Error('Error when parse manifest json: api.url is missing');
    }
    if (!data.contact_email) {
      throw new Error('Error when parse manifest json: contact_email is missing');
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
    await this.toolsRepository.saveServer(manifestUrl, baseUrl, manifestData);
    if (manifestData.credentials) {
      await this.credentialsRepository.createOrUpdateCredentialTypes(namespace, manifestData.credentials);
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

    await this.toolsRepository.createOrUpdateTools('system', builtInBlocks);
  }
}
