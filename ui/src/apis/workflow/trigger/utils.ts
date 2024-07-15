import { WorkflowTriggerType } from '@/apis/workflow/trigger/typings.ts';

export const getDescOfTriggerType = (triggerType: WorkflowTriggerType) => {
  switch (triggerType) {
    case WorkflowTriggerType.MANUALLY:
      return 'Manual execution';
    case WorkflowTriggerType.SCHEDULER:
      return 'Scheduled execution';
    case WorkflowTriggerType.WEBHOOK:
      return 'Webhook';
    default:
      return 'Manual execution';
  }
};
