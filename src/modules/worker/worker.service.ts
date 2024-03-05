import { config } from '@/common/config';
import { enumToList } from '@/common/utils';
import { BlockDefinition } from '@inf-monkeys/vines';
import { ConductorClient, TaskDef, TaskManager } from '@io-orkes/conductor-javascript';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import os from 'os';
import { ApiType, AuthType, MenifestJson, RegisterWorkerParams, SchemaVersion } from './interfaces';
import { parseOpenApiSpecAsBlocks } from './utils/openapi-parser';
import { WORKER } from './worker.handler';

@Injectable()
export class WorkerService {
  private conductorClient: ConductorClient;
  constructor() {
    this.conductorClient = new ConductorClient({
      serverUrl: config.conductor.baseUrl,
    });
  }

  private getWorkerId() {
    return os.hostname();
  }

  public async startPolling() {
    await this.conductorClient.metadataResource.registerTaskDef([
      {
        name: WORKER.taskDefName,
        inputKeys: [],
        outputKeys: [],
        retryCount: 0,
        timeoutSeconds: 86400,
        ownerEmail: 'dev@inf-monkeys.com',
      },
    ] as Array<TaskDef>);
    const manager = new TaskManager(this.conductorClient, [WORKER], {
      options: { pollInterval: config.conductor.polling.interval, workerID: this.getWorkerId(), concurrency: config.conductor.polling.concurrency },
    });
    manager.startPolling();
  }

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

  private async parseOpenapiAsBlocks(namespace: string, specUrl: string): Promise<BlockDefinition[]> {
    const { data: specData } = await axios.get(specUrl);
    const blocks = parseOpenApiSpecAsBlocks(namespace, specData);
    return blocks;
  }

  public async registerWorker(params: RegisterWorkerParams) {
    const { menifestJsonUrl } = params;
    const { data: menifestData } = await axios.get<MenifestJson>(menifestJsonUrl);
    await this.validateMenifestJson(menifestData);

    const {
      api: { url: apiUrl, type: apiType },
      namespace,
    } = menifestData;

    let blocks: BlockDefinition[] = [];
    switch (apiType) {
      case ApiType.openapi:
        blocks = await this.parseOpenapiAsBlocks(namespace, apiUrl);
        break;
      default:
        throw new Error(`Error when import block: invalid api.type "${apiType}", must in any one of ${enumToList(ApiType).join(',')}`);
    }

    // TODO: use local json file as mock
    return blocks;
  }
}
