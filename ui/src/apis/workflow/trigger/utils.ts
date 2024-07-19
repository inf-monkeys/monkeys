import { WorkflowTriggerType } from '@/apis/workflow/trigger/typings.ts';
import i18n from '@/i18n.ts';

const { t } = i18n;

export const getDescOfTriggerType = (triggerType: WorkflowTriggerType) => {
  return [WorkflowTriggerType.MANUAL, WorkflowTriggerType.WEBHOOK, WorkflowTriggerType.SCHEDULER].includes(triggerType)
    ? t(`common.workflow.trigger.${triggerType}`)
    : t(`common.workflow.trigger.${WorkflowTriggerType.MANUAL}`);
};
