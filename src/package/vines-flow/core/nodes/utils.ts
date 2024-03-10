import { TaskType } from '@io-orkes/conductor-javascript';

import { VinesCore } from '@/package/vines-flow/core';
import { VinesNode } from '@/package/vines-flow/core/nodes/base.ts';
import { VinesSubWorkflowTaskDef } from '@/package/vines-flow/core/nodes/node/sub-workflow.ts';
import { VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { createNanoId } from '@/package/vines-flow/core/utils.ts';

export function createNewSubWorkflow(tasks: VinesTask[], vinesCore: VinesCore) {
  const nodeId = 'sub_workflow_nested_' + createNanoId();
  const subWorkflowTaskDef: Required<Omit<VinesSubWorkflowTaskDef, 'subWorkflowParam'>> = {
    name: 'sub_workflow',
    taskReferenceName: nodeId,
    type: TaskType.SUB_WORKFLOW,
    inputParameters: {
      name: '',
      version: 1,
    },
    subWorkflow: {
      name: nodeId,
      iconUrl: 'emoji:🍀:#ceefc5',
      description: '',
      workflowDef: {
        tasks,
      },
    },
  };

  return VinesNode.create(subWorkflowTaskDef as VinesSubWorkflowTaskDef, vinesCore);
}
