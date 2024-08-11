import { VinesCore } from '@/package/vines-flow/core';
import { VinesNode } from '@/package/vines-flow/core/nodes/base';
import { IVinesNodeController } from '@/package/vines-flow/core/nodes/typings.ts';
import { TaskType } from '@/package/vines-flow/share/types.ts';

export class EndPointNode extends VinesNode {
  static {
    VinesNode.register(TaskType.START, EndPointNode);
  }

  static createStart(vinesCore: VinesCore) {
    return new EndPointNode(
      {
        name: '开始',
        taskReferenceName: 'workflow_start',
        type: TaskType.SIMPLE,
      },
      vinesCore,
    );
  }

  static createEnd(vinesCore: VinesCore) {
    return new EndPointNode(
      {
        name: '结束',
        taskReferenceName: 'workflow_end',
        type: TaskType.SIMPLE,
      },
      vinesCore,
    );
  }

  override getController(): IVinesNodeController[] {
    return !this.id.endsWith('end') ? super.getController() : [];
  }

  override async renderEdge() {
    if (!this.id.endsWith('end')) {
      return super.renderEdge();
    }
  }
}
