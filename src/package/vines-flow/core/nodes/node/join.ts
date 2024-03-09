import { JoinTaskDef, TaskType } from '@io-orkes/conductor-javascript';

import { VinesCore } from '@/package/vines-flow/core';
import { ControlFlowVinesNode, VinesNode } from '@/package/vines-flow/core/nodes/base.ts';

export type VinesJoinTaskDef = JoinTaskDef & { __forkTaskId?: string };

export class JoinNode extends ControlFlowVinesNode<VinesJoinTaskDef> {
  static {
    VinesNode.register(TaskType.JOIN, JoinNode);
  }

  constructor(task: VinesJoinTaskDef, vinesCore: VinesCore) {
    super(task, vinesCore);
  }
}
