import { VinesNodeExecutionTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { VinesWorkflowExecutionType } from '@/package/vines-flow/core/typings.ts';

export const getExecutionStatusText = (
  status: VinesNodeExecutionTask['status'] | string,
  workflowStatus: VinesWorkflowExecutionType | string,
) => {
  switch (status) {
    case 'COMPLETED':
      return 'completed';
    case 'CANCELED':
      return 'canceled';
    case 'SKIPPED':
      return 'skipped';
    case 'TIMED_OUT':
      return 'timeout';
    case 'FAILED':
      return 'failed';
    case 'FAILED_WITH_TERMINAL_ERROR':
      return 'failed-with-terminal-error';
    case 'IN_PROGRESS':
      return 'in-progress';
    case 'SCHEDULED':
      return 'scheduled';
    case 'RUNNING':
      return 'running';
    case 'TERMINATED':
      return 'terminated';
    default:
      return workflowStatus === 'PAUSED'
        ? 'paused'
        : workflowStatus === 'SCHEDULED'
          ? 'scheduled'
          : 'unknown';
  }
};
