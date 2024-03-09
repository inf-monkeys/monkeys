import { MonkeyTaskDefTypes } from '@inf-monkeys/vines';

import { VinesBase } from '@/package/vines-flow/core/base';
import { EndPointNode, VinesNode } from '@/package/vines-flow/core/nodes';
import { IVinesWorkflowUpdate } from '@/package/vines-flow/core/nodes/typings.ts';
import { VinesTools } from '@/package/vines-flow/core/tools';

export class VinesCore extends VinesTools(VinesBase) {
  public workflowId: string | undefined;

  public nodes: VinesNode[] = [];

  public tasks: MonkeyTaskDefTypes[] = [];

  private init() {
    this.nodes = this.tasks.map((it) => VinesNode.create(it, this));
    this.nodes.splice(0, 0, EndPointNode.createStart(this));
    this.nodes.push(EndPointNode.createEnd(this));
  }

  public update({ workflow, workflowId, tasks }: IVinesWorkflowUpdate) {
    if (workflow) {
      workflow?.workflowDef?.tasks && (this.tasks = workflow.workflowDef.tasks.filter((task) => task));
      workflow?.workflowId && (this.workflowId = workflow.workflowId);
    }
    workflowId && (this.workflowId = workflowId);
    tasks && (this.tasks = tasks.filter((task) => task));

    this.init();
  }
}
