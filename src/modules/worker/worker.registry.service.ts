import { enumToList } from '@/common/utils';
import { BlockDefinition } from '@inf-monkeys/vines';
import { Injectable } from '@nestjs/common';
import { OpenAPIObject } from '@nestjs/swagger';
import { ServerObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import axios from 'axios';
import url from 'url';
import { ApiType, AuthType, ManifestJson, RegisterWorkerParams, SchemaVersion } from './interfaces';
import { parseOpenApiSpecAsBlocks } from './utils/openapi-parser';

@Injectable()
export class WorkerRegistryService {
  private regitries: ManifestJson[] = [];
  private blocks: BlockDefinition[] = [];
  private registeyToServers: { [x: string]: ServerObject[] } = {};
  constructor() {}

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

  public async registerBlocks(params: RegisterWorkerParams) {
    const { manifestJsonUrl } = params;
    const { data: manifestData } = await axios.get<ManifestJson>(manifestJsonUrl);
    await this.validateManifestJson(manifestData);

    const {
      api: { url: specUrl, type: apiType },
      namespace,
    } = manifestData;

    let realSpecUrl = specUrl;
    if (!realSpecUrl.startsWith('http://') && !realSpecUrl.startsWith('https://')) {
      const parsedUrl = url.parse(manifestJsonUrl);
      const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
      realSpecUrl = url.resolve(baseUrl, realSpecUrl);
    }

    let blocks: BlockDefinition[] = [];
    let servers: ServerObject[] = [];
    switch (apiType) {
      case ApiType.openapi:
        const res = await this.parseOpenapiAsBlocks(namespace, realSpecUrl);
        blocks = res.blocks;
        servers = res.servers;
        break;
      default:
        throw new Error(`Error when import block: invalid api.type "${apiType}", must in any one of ${enumToList(ApiType).join(',')}`);
    }

    this.blocks = this.blocks.concat(blocks);
    this.regitries = this.regitries.concat([manifestData]);
    this.registeyToServers[namespace] = servers;
    return blocks;
  }

  public listBlocks() {
    return this.blocks;
  }

  public listRegistries() {
    return this.regitries;
  }

  public listServers() {
    return this.registeyToServers;
  }
}
