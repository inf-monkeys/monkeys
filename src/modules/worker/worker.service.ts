import { CONDUCTOR_BASE_URL, CONDUCTOR_CLIENT_POLLING_CONCURRENCY, CONDUCTOR_CLIENT_POLLING_INTERVAL } from '@/common/config';
import { ConductorClient, TaskDef, TaskManager } from '@io-orkes/conductor-javascript';
import { Injectable } from '@nestjs/common';
import os from 'os';
import { worker } from './worker.handler';

@Injectable()
export class WorkerService {
  constructor() {}

  private getWorkerId() {
    return os.hostname();
  }

  public async startPolling() {
    const conductorClient = new ConductorClient({
      serverUrl: CONDUCTOR_BASE_URL,
    });
    await conductorClient.metadataResource.registerTaskDef([
      {
        name: worker.taskDefName,
        inputKeys: [],
        outputKeys: [],
        retryCount: 0,
        timeoutSeconds: 86400,
        ownerEmail: 'dev@inf-monkeys.com',
      },
    ] as Array<TaskDef>);
    const manager = new TaskManager(conductorClient, [worker], {
      options: { pollInterval: parseInt(CONDUCTOR_CLIENT_POLLING_INTERVAL), workerID: this.getWorkerId(), concurrency: parseInt(CONDUCTOR_CLIENT_POLLING_CONCURRENCY) },
    });
    manager.startPolling();
  }
}
