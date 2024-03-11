import { type ForkJoinTaskDef, TaskType } from '@io-orkes/conductor-javascript';

import { VinesCore } from '@/package/vines-flow/core';
import { ControlFlowVinesNode, VinesNode } from '@/package/vines-flow/core/nodes/base.ts';

export type VinesForkJoinTaskDef = ForkJoinTaskDef & { __joinTaskId?: string };

export class ForkJoinNode extends ControlFlowVinesNode<VinesForkJoinTaskDef> {
  static {
    VinesNode.register(TaskType.FORK_JOIN, ForkJoinNode);
  }

  public joinTaskId: string | null = null;

  public branches: VinesNode[][] = [];

  public readonly maxBranches = 5;

  private joinOnBranchIndex: number[] = [];

  constructor(task: VinesForkJoinTaskDef, vinesCore: VinesCore) {
    super(task, vinesCore);

    this.parseChildren(task?.forkTasks ?? []);
    this.joinTaskId = task.__joinTaskId ?? null;

    const taskJoinOn = (task.inputParameters?.joinOn as (number | string)[] | undefined) ?? [];
    if (Array.isArray(taskJoinOn)) {
      const hasAll = taskJoinOn.includes('all');
      void (!hasAll && (this.joinOnBranchIndex = taskJoinOn.map((it) => Number(it)).filter((it) => !isNaN(it))));
    }
  }

  private parseChildren(forkTasks: VinesForkJoinTaskDef['forkTasks']) {
    this.branches = forkTasks.map((branch) => branch.map((node) => VinesNode.create(node, this._vinesCore)));
    this.children = this.branches.flat();
    if (!this.joinOnBranchIndex.length) {
      this.joinOnBranchIndex = Array.from({ length: this.branches.length }, (_, i) => i);
    } else {
      this.joinOnBranchIndex = this.joinOnBranchIndex.filter((it) => it < this.branches.length);
    }
  }
}
