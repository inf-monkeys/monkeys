import equal from 'fast-deep-equal/es6';
import { get, omit, set } from 'lodash';

import { getWorkflowExecution } from '@/apis/workflow/execution';
import { VinesCore } from '@/package/vines-flow/core';
import { ControlFlowVinesNode, VinesNode } from '@/package/vines-flow/core/nodes/base.ts';
import { drawSmoothLine, VinesSVGPosition } from '@/package/vines-flow/core/nodes/svg-utils.ts';
import {
  IVinesNodeBoundary,
  IVinesNodePosition,
  VinesEdgePath,
  VinesNodeExecutionTask,
  VinesTask,
} from '@/package/vines-flow/core/nodes/typings.ts';
import { IVinesInsertChildParams, VinesWorkflowExecution } from '@/package/vines-flow/core/typings.ts';
import { getBoundary } from '@/package/vines-flow/core/utils.ts';
import { type SubWorkflowTaskDef, TaskType, WorkflowDef } from '@/package/vines-flow/share/types.ts';

export type VinesSubWorkflowTaskDef = SubWorkflowTaskDef & {
  subWorkflowParam: {
    workflowDefinition: WorkflowDef;
  };
};

export class SubWorkflowNode extends ControlFlowVinesNode<VinesSubWorkflowTaskDef> {
  static {
    VinesNode.register(TaskType.SUB_WORKFLOW, SubWorkflowNode);
  }

  constructor(task: VinesSubWorkflowTaskDef, vinesCore: VinesCore) {
    super(task, vinesCore);
    this.parseChildren(task?.subWorkflowParam?.workflowDefinition?.tasks ?? []);
  }

  private parseChildren(tasks: VinesTask[]) {
    this.children = tasks.map((it) => VinesNode.create(it, this._vinesCore));
  }

  override getRaw() {
    if (this.isNested) {
      set(
        this._task,
        'subWorkflowParam.workflowDefinition.tasks',
        this.children.map((it) => it.getRaw()),
      );
    }

    return this._task;
  }

  override check(): boolean {
    void ((this._task as SubWorkflowTaskDef).inputParameters ??= {});
    this._task.name = this._task.name.replace(/^sub_workflow:/, 'sub_workflow_');
    this._task.taskReferenceName = this._task.taskReferenceName.replace(/^sub_workflow:/, 'sub_workflow_');
    this.id = this._task.taskReferenceName;

    const taskName = this._task.name;
    const subWorkflowId = taskName.replace('sub_workflow_', '');

    const isNested = this.isNested;

    const nameInInputParameters = get(this._task, 'inputParameters.name', '');

    const finalName = nameInInputParameters ? nameInInputParameters : isNested ? this.id : subWorkflowId;
    set(this._task, 'subWorkflowParam.name', finalName);
    if (!isNested) {
      const versionInInputParameters = get(
        this._task,
        'inputParameters.version',
        get(this._task, 'subWorkflowParam.version', 1),
      );
      const subWorkflowVersion = Number(versionInInputParameters);

      set(this._task, 'subWorkflowParam.version', subWorkflowVersion);
      set(this._task, 'inputParameters.version', subWorkflowVersion);
    } else {
      set(this._task, 'subWorkflowParam.workflowDefinition.name', finalName);
    }

    const teamId = localStorage.getItem('vines-team-id');

    set(this._task, 'inputParameters.__context.teamId', teamId);

    return super.check();
  }

  override afterCreate(): VinesNode | VinesNode[] {
    this.check();
    return super.afterCreate();
  }

  override updateRaw(nodeId: string, task: VinesSubWorkflowTaskDef): boolean {
    const workflowVersion = Number(
      get(task, 'inputParameters.version', get(this._task, 'subWorkflowParam.version', 1)),
    );
    set(task, 'subWorkflowParam.version', workflowVersion);
    return super.updateRaw(nodeId, task);
  }

  get isNested() {
    return this.id.startsWith('sub_workflow_nested_') && this.children.length > 0;
  }

  override get needRenderChildren() {
    return !this.isNested || this._vinesCore.executionStatus() === 'RUNNING';
  }

  // region Render
  override async render(position: IVinesNodePosition, path?: VinesNode[], isLastNode = false): Promise<void> {
    this.clearSvg();

    // 如果获取不到工作流，那就按照 Simple 节点处理
    if (!this.children.length) {
      return super.render(position, [this, ...(path ?? [])], isLastNode);
    }

    if (this._vinesCore.renderDirection === 'horizontal') return this.renderHorizontal(position, path, isLastNode);

    if (this.isNested) {
      this.renderChildren(position, path);
    } else {
      this.position.x = position.x;
      this.position.y = position.y;

      const childOffset = this.size.width / 2 + 5;

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
    }
  }

  override renderHorizontal(position: IVinesNodePosition, _path?: VinesNode[], _isLastNode: boolean = false) {
    if (this.isNested) {
      this.renderChildren(position, _path);
    } else {
      this.position.x = position.x;
      this.position.y = position.y;

      const childOffset = -(this.size.width / 2 + 5);

      const nodeWidth = this.size.width;

      position.x += nodeWidth + 82;
      position.y += childOffset;
      this.renderChildren(position, _path);
      const { top } = this.getBoundary();
      const offset = top - this.position.y;
      if (offset < childOffset) {
        this.children.filter((it) => it.needRender).forEach((it) => it.move(0, childOffset - offset));
      }
      position.y -= childOffset;
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

    this._svgPath = this.renderHead(this.childNodes, 32);

    this.children.forEach((it, index) => it.renderEdge(index === this.children.length - 1));

    if (this._vinesCore.renderDirection === 'horizontal') return this.renderHorizontalEdge(lastNode);

    const lastChildEntry = this.children.at(-1)?.entryPoint ?? this.children[0].entryPoint;

    this.extraSvgPath = [
      [
        this.id + '_end',
        drawSmoothLine({
          sourceX: lastChildEntry.out.x,
          sourceY: lastChildEntry.out.y,
          targetX: this.position.x + this.size.width / 2,
          targetY: lastChildEntry.out.y + 120,
          centerY: lastChildEntry.out.y + 48,
        }),
      ],
    ];
  }

  override renderHorizontalEdge(lastNode: boolean = false) {
    if (this.children.length) {
      const lastChild = this.children.filter((it) => it.needRender).at(-1);
      if (lastChild) {
        this.extraSvgPath = [
          [
            this.id + '_end',
            drawSmoothLine({
              sourceX: lastChild.entryPoint.out.x,
              sourceY: lastChild.entryPoint.out.y,
              targetX: lastChild.entryPoint.out.x + 82,
              targetY: this.position.y + this.size.height / 2,
              centerY: lastChild.entryPoint.in.y + 48,
              sourcePosition: VinesSVGPosition.Right,
              targetPosition: VinesSVGPosition.Left,
            }),
          ],
        ];
      }
    } else {
      return super.renderHorizontalEdge(lastNode);
    }
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

  private _prevExecutionData: Partial<VinesWorkflowExecution> | undefined;
  override async updateExecutionTask(instanceId: string, task: VinesNodeExecutionTask): Promise<boolean> {
    await super.updateExecutionTask(instanceId, task, true);
    if (['IN_PROGRESS', 'COMPLETED', 'SCHEDULED'].includes(this.getExecutionTask(instanceId)?.status ?? '')) {
      const instanceId = task.outputData?.subWorkflowId;
      if (!instanceId) return false;

      const data = await getWorkflowExecution(instanceId);
      if (!data) return false;

      const equalData = omit(data, [
        'createTime',
        'updateTime',
        'startTime',
        'workflowVersion',
        'workflowName',
        'workflowDefinition',
        'startBy',
        'triggerType',
      ]);

      let needRender = !equal(equalData, this._prevExecutionData);

      for (const _task of data?.tasks ?? []) {
        const taskId = _task.workflowTask?.taskReferenceName;
        if (!taskId) continue;
        const childNode = this.findChildById(taskId);
        if ((await childNode?.updateExecutionTask(instanceId, _task, true)) && !needRender) {
          needRender = true;
        }
      }
      this._prevExecutionData = equalData;

      return needRender;
    }
    return false;
  }

  override checkChildren(path: VinesNode[] = []) {
    if (!this.isNested && !this.children.length) {
      const subWorkflowTasks = get(
        this._vinesCore.getTool(this._task.name),
        'extra.workflowDef.tasks',
        [],
      ) as VinesTask[];
      if (subWorkflowTasks.length) {
        this.children = subWorkflowTasks.map((it) => VinesNode.create(it, this._vinesCore));
        if (this.children.some((it) => it instanceof SubWorkflowNode && path.some((node) => node.id === it.id))) {
          throw new Error('[VinesFlow] 存在子流程循环引用');
        }
        this.children.forEach((it) => it.checkChildren([this, ...path]));
        return true;
      }
    }

    return super.checkChildren([this, ...path]);
  }

  override restoreChildren(): boolean {
    if (!this.isNested) {
      this.children = [];
      return true;
    }
    return super.restoreChildren();
  }
}
