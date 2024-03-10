import { MonkeyWorkflow } from '@inf-monkeys/vines';
import { type SubWorkflowTaskDef, TaskType } from '@io-orkes/conductor-javascript';

import { ControlFlowVinesNode, VinesNode } from '@/package/vines-flow/core/nodes/base.ts';
import { VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';

export type VinesSubWorkflowTaskDef = SubWorkflowTaskDef & {
  subWorkflow: Pick<MonkeyWorkflow, 'name' | 'iconUrl' | 'description'> & { workflowDef: { tasks: VinesTask[] } };
};

export class SubWorkflowNode extends ControlFlowVinesNode<VinesSubWorkflowTaskDef> {
  static {
    VinesNode.register(TaskType.SUB_WORKFLOW, SubWorkflowNode);
  }
}
