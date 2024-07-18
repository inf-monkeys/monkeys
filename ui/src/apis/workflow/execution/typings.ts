import { MonkeyWorkflow } from '@inf-monkeys/monkeys';
import type { Workflow as WorkflowExecution } from '@io-orkes/conductor-javascript';

import { VinesWorkflowExecution } from '@/package/vines-flow/core/typings.ts';

export type VinesWorkflowExecutionLists = {
  page: number;
  limit: number;
  total: number;
  data: VinesWorkflowExecution[];
  definitions: MonkeyWorkflow[];
};

export type VinesWorkflowExecutionStatLists = {
  data: VinesWorkflowExecutionStatData[];
};
export type VinesWorkflowExecutionStatData = {
  date: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  averageTime: number;
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

export interface ChatMessage {
  startTime: string;
  endTime: string;
  role: string;
  content: string;
}
