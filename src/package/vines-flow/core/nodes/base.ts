import { MonkeyTaskDefTypes } from '@inf-monkeys/vines';
import { TaskType } from '@io-orkes/conductor-javascript';

import { VinesCore } from '@/package/vines-flow/core';
import { VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';

export type NodeClass = new (task: any, vinesCore: VinesCore) => VinesNode;

export class VinesNode<T extends VinesTask = VinesTask> {
  public id: string;

  public type: TaskType;

  public _task: T;

  private children: VinesNode[];

  private _vinesCore: VinesCore;

  constructor(task: T, vinesCore: VinesCore) {
    this.type = task.type;
    this._task = task;
    this._vinesCore = vinesCore;
    this.id = this._task.taskReferenceName;
    this.children = [];
  }

  static classMap: Record<string, NodeClass> = {
    SIMPLE: VinesNode,
    HUMAN: VinesNode,
  };

  static register(type: TaskType, nodeClass: NodeClass) {
    VinesNode.classMap[type] = nodeClass;
  }

  static create(task: VinesTask, vinesCore: VinesCore): VinesNode {
    const { type } = task;
    if (!VinesNode.classMap[type]) {
      console.warn('[VinesFlow] 发现不支持的节点类型', type);
      return new VinesNode.classMap[TaskType.SIMPLE](task, vinesCore);
    }
    return new VinesNode.classMap[type](task, vinesCore);
  }
}

// 「控制流程节点」公用逻辑
export class ControlFlowVinesNode<T extends MonkeyTaskDefTypes = MonkeyTaskDefTypes> extends VinesNode<T> {}
