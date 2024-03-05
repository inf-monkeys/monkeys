import { config } from '@/common/config';
import { ConductorClient, TaskDef, TaskManager } from '@io-orkes/conductor-javascript';
import { Injectable } from '@nestjs/common';
import os from 'os';
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
}
