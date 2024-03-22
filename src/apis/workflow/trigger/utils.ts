import { WorkflowTriggerType } from '@/apis/workflow/trigger/typings.ts';

export const getDescOfTriggerType = (triggerType: WorkflowTriggerType) => {
  switch (triggerType) {
    case WorkflowTriggerType.MANUALLY:
      return '手动执行';
    case WorkflowTriggerType.SCHEDULER:
      return '定时任务';
    case WorkflowTriggerType.WEBHOOK:
      return 'Webhook';
    default:
      return '手动执行';
  }
};
