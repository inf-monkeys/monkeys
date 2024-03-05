import { CONDUCTOR_BASE_URL, CONDUCTOR_CLIENT_POLLING_CONCURRENCY, CONDUCTOR_CLIENT_POLLING_INTERVAL } from '@/common/config';
import { ConductorClient, TaskDef, TaskManager } from '@io-orkes/conductor-javascript';
import { Injectable } from '@nestjs/common';
import os from 'os';
import { WORKER } from './worker.handler';

@Injectable()
export class WorkerService {
  private conductorClient: ConductorClient;
  constructor() {
    this.conductorClient = new ConductorClient({
      serverUrl: CONDUCTOR_BASE_URL,
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
      options: { pollInterval: parseInt(CONDUCTOR_CLIENT_POLLING_INTERVAL), workerID: this.getWorkerId(), concurrency: parseInt(CONDUCTOR_CLIENT_POLLING_CONCURRENCY) },
    });
    manager.startPolling();
  }
}
