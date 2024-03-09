import { type ForkJoinTaskDef, TaskType } from '@io-orkes/conductor-javascript';

import { VinesCore } from '@/package/vines-flow/core';
import { ControlFlowVinesNode, VinesNode } from '@/package/vines-flow/core/nodes/base.ts';

export type VinesForkJoinTaskDef = ForkJoinTaskDef & { __joinTaskId?: string };

export class ForkJoinNode extends ControlFlowVinesNode<VinesForkJoinTaskDef> {
  static {
    VinesNode.register(TaskType.FORK_JOIN, ForkJoinNode);
  }

  constructor(task: VinesForkJoinTaskDef, vinesCore: VinesCore) {
    super(task, vinesCore);
  }
}
