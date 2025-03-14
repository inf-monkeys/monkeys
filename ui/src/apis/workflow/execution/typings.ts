import { MonkeyWorkflow } from '@inf-monkeys/monkeys';

import { VinesWorkflowExecution } from '@/package/vines-flow/core/typings.ts';
import type { Workflow as WorkflowExecution } from '@/package/vines-flow/share/types.ts';
import { IVinesSearchWorkflowExecutionStatParams } from '@/schema/workspace/workflow-execution-stat.ts';

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

export interface IVinesSearchWorkflowExecutionStatExportParams extends IVinesSearchWorkflowExecutionStatParams {
  format: 'csv';
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
