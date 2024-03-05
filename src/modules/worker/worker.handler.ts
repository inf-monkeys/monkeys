import { config } from '@/common/config';
import { ConductorWorker, Task } from '@io-orkes/conductor-javascript';

export const WORKER: ConductorWorker = {
  taskDefName: 'monkey',
  concurrency: config.conductor.polling.concurrency,
  pollInterval: config.conductor.polling.interval,
  execute: async (task: Task) => {
    // Sample output
    return {
      outputData: task.inputData,
      status: 'COMPLETED',
    };
  },
};
