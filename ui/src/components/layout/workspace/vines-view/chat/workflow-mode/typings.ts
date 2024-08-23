import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { VinesWorkflowExecution } from '@/package/vines-flow/core/typings.ts';

export interface IVinesChatListItem {
  startTime: string;
  endTime: string;
  input: VinesWorkflowVariable[];
  originalInput: Required<VinesWorkflowExecution['input']>;
  output: Required<VinesWorkflowExecution['output']>;
  instanceId: string;
  status: VinesWorkflowExecution['status'];
  userPhoto: string;
  userName: string;
  botPhoto: string;
}
