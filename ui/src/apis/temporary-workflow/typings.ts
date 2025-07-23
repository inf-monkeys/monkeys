import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings';

export interface TemporaryWorkflow {
  temporaryId: string;
  workflowId: string;
  workflowVersion: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  inputData: VinesWorkflowVariable[];
  expiresAt: string;
  createdTimestamp: number;
}

export interface TemporaryWorkflowInstance {
  status: 'COMPLETED' | 'RUNNING' | 'FAILED' | 'PENDING';
  createTime: number;
  startTime: number;
  updateTime: number;
  endTime: number;
  input: any;
  rawInput: {
    [key: string]: any;
    __context: {
      userId: string;
      teamId: string;
      appId: string;
      group: string;
    };
  };
  output: Array<{
    type: string;
    data: any;
    key: string;
  }>;
  rawOutput: {
    [key: string]: any;
  };
  workflowId: string;
  instanceId: string;
  userId: string;
  teamId: string;
}
