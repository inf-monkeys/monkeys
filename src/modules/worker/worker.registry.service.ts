import { enumToList } from '@/common/utils';
import { BlockDefinition } from '@inf-monkeys/vines';
import { Injectable } from '@nestjs/common';
import { OpenAPIObject } from '@nestjs/swagger';
import { ServerObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import axios from 'axios';
import url from 'url';
import { ApiType, AuthType, MenifestJson, RegisterWorkerParams, SchemaVersion } from './interfaces';
import { parseOpenApiSpecAsBlocks } from './utils/openapi-parser';

@Injectable()
export class WorkerRegistryService {
  private regitries: MenifestJson[] = [];
  private blocks: BlockDefinition[] = [];
  private registeyToServers: { [x: string]: ServerObject[] } = {};
  constructor() {}

  private async validateMenifestJson(data: MenifestJson) {
    if (!data) {
      throw new Error('Error when parse menifest json: menifest data is empty');
    }
    if (!data.schema_version) {
      throw new Error('Error when parse menifest json: schema_version is missing');
    }
    if (!enumToList(SchemaVersion).includes(data.schema_version)) {
      throw new Error(`Error when parse menifest json: invalid schema_version "${data.schema_version}", must in any one of ${enumToList(SchemaVersion).join(',')}`);
    }
    if (!data.namespace) {
      throw new Error('Error when parse menifest json: namespace is missing');
    }
    if (!data.auth) {
      throw new Error('Error when parse menifest json: auth is missing');
    }
    if (!enumToList(AuthType).includes(data.auth.type)) {
      throw new Error(`Error when parse menifest json: invalid auth.type "${data.auth.type}", must in any one of ${enumToList(AuthType).join(',')}`);
    }
    if (!data.api) {
      throw new Error('Error when parse menifest json: api is missing');
    }
    if (!enumToList(ApiType).includes(data.api.type)) {
      throw new Error(`Error when parse menifest json: invalid api.type "${data.api.type}", must in any one of ${enumToList(ApiType).join(',')}`);
    }
    if (!data.api.url) {
      throw new Error('Error when parse menifest json: api.url is missing');
    }
    if (!data.contact_email) {
      throw new Error('Error when parse menifest json: contact_email is missing');
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
    const { menifestJsonUrl } = params;
    const { data: menifestData } = await axios.get<MenifestJson>(menifestJsonUrl);
    await this.validateMenifestJson(menifestData);

    const {
      api: { url: specUrl, type: apiType },
      namespace,
    } = menifestData;

    let realSpecUrl = specUrl;
    if (!realSpecUrl.startsWith('http://') && !realSpecUrl.startsWith('https://')) {
      const parsedUrl = url.parse(menifestJsonUrl);
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
    this.regitries = this.regitries.concat([menifestData]);
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
