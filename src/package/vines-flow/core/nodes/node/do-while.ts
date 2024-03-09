import { type DoWhileTaskDef, TaskType } from '@io-orkes/conductor-javascript';

import { VinesCore } from '@/package/vines-flow/core';
import { ControlFlowVinesNode, VinesNode } from '@/package/vines-flow/core/nodes/base.ts';

export class DoWhileNode extends ControlFlowVinesNode<DoWhileTaskDef> {
  static {
    VinesNode.register(TaskType.DO_WHILE, DoWhileNode);
  }

  constructor(task: DoWhileTaskDef, vinesCore: VinesCore) {
    super(task, vinesCore);
  }
}
