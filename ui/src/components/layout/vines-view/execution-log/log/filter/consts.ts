import { WorkflowTriggerType } from '@inf-monkeys/monkeys';
import { Workflow } from '@io-orkes/conductor-javascript';

export const EXECUTION_STATUS_LIST: Workflow['status'][] = [
  'RUNNING',
  'COMPLETED',
  'PAUSED',
  'FAILED',
  'TIMED_OUT',
  'TERMINATED',
];

export const TRIGGER_TYPE_LIST: WorkflowTriggerType[] = [
  WorkflowTriggerType.MANUALLY,
  WorkflowTriggerType.SCHEDULER,
  WorkflowTriggerType.WEBHOOK,
];
