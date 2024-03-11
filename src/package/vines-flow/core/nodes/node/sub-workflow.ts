import { MonkeyWorkflow } from '@inf-monkeys/vines';
import { type SubWorkflowTaskDef, TaskType } from '@io-orkes/conductor-javascript';
import { set } from 'lodash';

import { VinesCore } from '@/package/vines-flow/core';
import { ControlFlowVinesNode, VinesNode } from '@/package/vines-flow/core/nodes/base.ts';
import { drawSmoothLine } from '@/package/vines-flow/core/nodes/svg-utils.ts';
import {
  IVinesNodeBoundary,
  IVinesNodePosition,
  VinesEdgePath,
  VinesTask,
} from '@/package/vines-flow/core/nodes/typings.ts';
import { IVinesInsertChildParams, IVinesMode } from '@/package/vines-flow/core/typings.ts';
import { getBoundary } from '@/package/vines-flow/core/utils.ts';

export type VinesSubWorkflowTaskDef = SubWorkflowTaskDef & {
  subWorkflow: Pick<MonkeyWorkflow, 'name' | 'iconUrl' | 'description'> & { workflowDef: { tasks: VinesTask[] } };
};

export class SubWorkflowNode extends ControlFlowVinesNode<VinesSubWorkflowTaskDef> {
  static {
    VinesNode.register(TaskType.SUB_WORKFLOW, SubWorkflowNode);
  }

  constructor(task: VinesSubWorkflowTaskDef, vinesCore: VinesCore) {
    super(task, vinesCore);
    this.parseChildren(task?.subWorkflow?.workflowDef?.tasks ?? []);
  }

  private parseChildren(tasks: VinesTask[]) {
    this.children = tasks.map((it) => VinesNode.create(it, this._vinesCore));
  }

  override getRaw() {
    set(
      this._task,
      'subWorkflow.workflowDef.tasks',
      this.children.map((it) => it.getRaw()),
    );
    return this._task;
  }

  override check(): boolean {
    void ((this._task as SubWorkflowTaskDef).inputParameters ??= {});
    this._task.name = this._task.name.replace(/^sub_workflow:/, 'sub_workflow_');
    this._task.taskReferenceName = this._task.taskReferenceName.replace(/^sub_workflow:/, 'sub_workflow_');
    this.id = this._task.taskReferenceName;
    if (this._task.inputParameters) {
      void (
        !this._task.inputParameters?.name &&
        (this._task.inputParameters.name = this._task.name.replace('sub_workflow_', ''))
      );
      if (this._task.inputParameters?.version) {
        this._task.inputParameters.version = Number(this._task.inputParameters.version) || 1;
        void ((this._task.inputParameters.version as number) < 1 && (this._task.inputParameters.version = 1));
      } else {
        this._task.inputParameters.version = 1;
      }
    }

    return super.check();
  }

  get isNested() {
    return this.id.startsWith('sub_workflow_nested_');
  }

  override get needRenderChildren() {
    return !this.isNested || this._vinesCore.mode === IVinesMode.EXEC;
  }

  override get childNodes(): VinesNode[] {
    if (this._vinesCore.mode !== IVinesMode.EDIT) {
      return super.childNodes;
    }
    return [];
  }

  // region Render
  override async render(position: IVinesNodePosition, path?: VinesNode[], isLastNode = false): Promise<void> {
    this.clearSvg();

    // 如果获取不到工作流，那就按照 Simple 节点处理
    if (!this.children.length) {
      return super.render(position, [this, ...(path ?? [])], isLastNode);
    }

    if (!this.isNested) {
      this.position.x = position.x;
      this.position.y = position.y;

      const childOffset = 5;

      const nodeHeight = this.size.height;

      position.x += childOffset;
      position.y += nodeHeight + 82;
      this.renderChildren(position, path);
      const { left } = this.getBoundary();
      const offset = left - this.position.x;
      if (offset < childOffset) {
        this.children.filter((it) => it.needRender).forEach((it) => it.move(childOffset - offset));
      }
      position.x -= childOffset;
      if (isLastNode) {
        position.y -= nodeHeight + 28;
      } else {
        position.y = this.entryPoint.out.y;
      }
    } else {
      this.renderChildren(position, path);
    }
  }

  override svgPath() {
    return [...this.extraSvgPath, [this.id + '_head', this._svgPath]] as [string, VinesEdgePath][];
  }

  override renderEdge(lastNode = false) {
    if (!this.children.length) {
      return super.renderEdge(lastNode);
    }

    if (this.isNested) {
      return this.children.forEach((it, index) => it.renderEdge(index === this.children.length - 1 && lastNode));
    }

    this._svgPath = this.renderHead(this.childNodes);

    this.children.forEach((it, index) => it.renderEdge(index === this.children.length - 1));

    const lastChildEntry = this.children.at(-1)?.entryPoint ?? this.children[0].entryPoint;

    this.extraSvgPath = [
      [
        this.id + '_end',
        drawSmoothLine({
          sourceX: lastChildEntry.out.x,
          sourceY: lastChildEntry.out.y,
          targetX: this.position.x + 40,
          targetY: lastChildEntry.out.y + 120,
          centerY: lastChildEntry.out.y + 48,
        }),
      ],
    ];
  }

  override renderController() {
    if (!this.children.length) {
      return super.renderController();
    }

    if (this.isNested) {
      return this.children.forEach((it) => it.renderController());
    }
  }

  override get entryPoint() {
    const centerX = this.size.width / 2;
    const centerY = this.size.height / 2;
    const nodeHeight = this.size.height;

    if (!this.children.length) {
      if (this._vinesCore.renderDirection === 'vertical') {
        return {
          in: {
            x: this.position.x + centerX,
            y: this.position.y,
          },
          out: {
            x: this.position.x + centerX,
            y: this.position.y + nodeHeight,
          },
        };
      } else {
        return {
          in: {
            x: this.position.x,
            y: this.position.y + centerY,
          },
          out: {
            x: this.position.x + this.size.width,
            y: this.position.y + centerY,
          },
        };
      }
    }
    const inPoint = this.isNested
      ? this.children[0].entryPoint.in
      : { x: this.position.x + centerX, y: this.position.y };
    const lastChildEntry = this.children.filter((it) => it.needRender).at(-1)?.entryPoint;
    const outPoint = this.isNested
      ? lastChildEntry?.out ?? { x: 0, y: 0 }
      : { x: this.position.x + centerX, y: (lastChildEntry?.out.y ?? 0) + 120 };

    return {
      in: inPoint,
      out: outPoint,
    };
  }

  override getBoundary(children = this.children): IVinesNodeBoundary {
    if (!this.isNested) {
      return super.getBoundary(children);
    }
    return getBoundary(children);
  }
  // endregion

  // region CRUD
  override insertChild(params: IVinesInsertChildParams): VinesNode | VinesNode[] | null {
    const { node } = params;

    // 不能插自己 & 不能交叉插入
    if (node instanceof SubWorkflowNode) {
      const insertSubWorkFlowId = node._task.inputParameters?.name as string | undefined;
      const isSelfInsert = insertSubWorkFlowId === this._task.inputParameters?.name;
      const isCrossInsert = insertSubWorkFlowId && this.findChildById(insertSubWorkFlowId);

      if (isSelfInsert || isCrossInsert) {
        return null;
      }
    }

    return super.insertChild(params);
  }
  // endregion
}
