import { SwitchTaskDef, TaskType } from '@io-orkes/conductor-javascript';

import { VinesCore } from '@/package/vines-flow/core';
import { ControlFlowVinesNode, VinesNode } from '@/package/vines-flow/core/nodes/base.ts';

export class SwitchNode extends ControlFlowVinesNode<SwitchTaskDef> {
  static {
    VinesNode.register(TaskType.SWITCH, SwitchNode);
  }

  constructor(task: SwitchTaskDef, vinesCore: VinesCore) {
    super(task, vinesCore);
  }
}
