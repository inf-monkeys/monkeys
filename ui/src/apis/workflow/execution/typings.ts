import { MonkeyWorkflow } from '@inf-monkeys/vines';
import type { Workflow as WorkflowExecution } from '@io-orkes/conductor-javascript';

import { VinesWorkflowExecution } from '@/package/vines-flow/core/typings.ts';

export type VinesWorkflowExecutionLists = {
  page: number;
  limit: number;
  total: number;
  data: VinesWorkflowExecution[];
  definitions: MonkeyWorkflow[];
};

export interface IVinesSearchWorkflowExecutionsParams {
  workflowId: string;
  freeText?: string;
  creatorUserId?: string;
  startTimeFrom?: number;
  endTimeTo?: number;
  orderBy?: {
    field: 'startTime' | 'endTime' | 'workflowId' | 'workflowType' | 'status';
    order: 'DESC' | 'ASC';
  };
  pagination?: { page: number; limit: number };
  status?: WorkflowExecution['status'][];
}

export type IUpdateExecutionTaskParams = {
  status: 'COMPLETED' | 'FAILED' | 'CANCELED';
  outputData: Record<string, unknown>;
};