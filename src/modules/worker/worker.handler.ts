import { CONDUCTOR_CLIENT_POLLING_CONCURRENCY, CONDUCTOR_CLIENT_POLLING_INTERVAL } from '@/common/config';
import { ConductorWorker, Task } from '@io-orkes/conductor-javascript';

export const worker: ConductorWorker = {
  taskDefName: 'monkey',
  concurrency: parseInt(CONDUCTOR_CLIENT_POLLING_CONCURRENCY),
  pollInterval: parseInt(CONDUCTOR_CLIENT_POLLING_INTERVAL),
  execute: async (task: Task) => {
    // Sample output
    return {
      outputData: task.inputData,
      status: 'COMPLETED',
    };
  },
};
