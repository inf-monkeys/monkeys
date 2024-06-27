import { WorkflowTriggerType } from '@inf-monkeys/monkeys';
import { Workflow } from '@io-orkes/conductor-javascript';

export const EXECUTION_STATUS_LIST: { status: Workflow['status']; text: string }[] = [
  { status: 'RUNNING', text: 'Running' },
  { status: 'COMPLETED', text: 'Completed' },
  { status: 'PAUSED', text: 'Paused' },
  { status: 'FAILED', text: 'Failed' },
  { status: 'TIMED_OUT', text: 'Timed Out' },
  { status: 'TERMINATED', text: 'Terminated' },
];

export const TRIGGER_TYPE_LIST: { value: WorkflowTriggerType; text: string }[] = [
  { value: WorkflowTriggerType.MANUALLY, text: 'Manual' },
  { value: WorkflowTriggerType.SCHEDULER, text: 'Scheduler' },
  { value: WorkflowTriggerType.WEBHOOK, text: 'Webhook' },
];
