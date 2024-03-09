import { SubWorkflowTaskDef, TaskType } from '@io-orkes/conductor-javascript';

import { ControlFlowVinesNode, VinesNode } from '@/package/vines-flow/core/nodes/base.ts';

export class SubWorkflowNode extends ControlFlowVinesNode<SubWorkflowTaskDef> {
  static {
    VinesNode.register(TaskType.SUB_WORKFLOW, SubWorkflowNode);
  }
}
