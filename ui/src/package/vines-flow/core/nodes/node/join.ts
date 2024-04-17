import { JoinTaskDef, TaskType } from '@io-orkes/conductor-javascript';

import { VinesCore } from '@/package/vines-flow/core';
import { ForkJoinNode } from '@/package/vines-flow/core/nodes';
import { ControlFlowVinesNode, VinesNode } from '@/package/vines-flow/core/nodes/base.ts';

export type VinesJoinTaskDef = JoinTaskDef & { __forkTaskId?: string };

export class JoinNode extends ControlFlowVinesNode<VinesJoinTaskDef> {
  static {
    VinesNode.register(TaskType.JOIN, JoinNode);
  }

  public forkTaskId: string | null = null;

  public joinOn: string[] = [];

  constructor(task: VinesJoinTaskDef, vinesCore: VinesCore) {
    super(task, vinesCore);

    this.forkTaskId = task.__forkTaskId ?? null;
    this.joinOn = task.joinOn ?? [];
  }

  override check() {
    if (this.forkTaskId) {
      (this._vinesCore.getNodeById(this.forkTaskId) as unknown as ForkJoinNode)?.joinTaskId != this.id &&
        this._vinesCore.deleteNode(this.id);
    } else {
      this._vinesCore.deleteNode(this.id);
    }
    return super.check();
  }

  override getRaw() {
    void (this.forkTaskId && ((this._task as VinesJoinTaskDef).__forkTaskId = this.forkTaskId));
    void ((this._task as VinesJoinTaskDef).joinOn = this.joinOn);

    return super.getRaw();
  }

  override updateRaw(nodeId: string, task: VinesJoinTaskDef) {
    this.forkTaskId = task.__forkTaskId ?? null;
    this.joinOn = task.joinOn ?? [];

    return super.updateRaw(nodeId, task);
  }

  override get needRender() {
    return false;
  }
}
