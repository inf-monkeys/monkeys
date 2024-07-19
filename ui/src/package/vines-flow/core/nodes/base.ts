import { MonkeyTaskDefTypes } from '@inf-monkeys/monkeys';
import { TaskDefTypes, TaskType } from '@io-orkes/conductor-javascript';
import { isArray, max, min } from 'lodash';
import { toast } from 'sonner';

import { VinesCore } from '@/package/vines-flow/core';
import { drawLine, drawSmoothLine, VinesSVGPosition } from '@/package/vines-flow/core/nodes/svg-utils.ts';
import {
  IVinesEdge,
  IVinesMoveAfterTargetType,
  IVinesNodeBoundary,
  IVinesNodeController,
  IVinesNodeCustomData,
  IVinesNodeEntryPoint,
  IVinesNodePosition,
  IVinesNodeSize,
  VinesEdgePath,
  VinesNodeExecutionTask,
  VinesNodeStatus,
  VinesTask,
} from '@/package/vines-flow/core/nodes/typings.ts';
import { IVinesVariable, VinesVariableMapper } from '@/package/vines-flow/core/tools/typings.ts';
import { IVinesInsertChildParams } from '@/package/vines-flow/core/typings.ts';
import { createNanoId, createSubWorkflowDef } from '@/package/vines-flow/core/utils.ts';
import { getI18nContent } from '@/utils';
import VinesEvent from '@/utils/events.ts';

export type NodeClass = new (task: any, vinesCore: VinesCore) => VinesNode;

export class VinesNode<T extends VinesTask = VinesTask> {
  public id: string;

  public type: TaskType;

  public _task: T;

  public size: IVinesNodeSize = { width: 80, height: 80 };

  public position: IVinesNodePosition = { x: 0, y: 0 };

  public controller: IVinesNodeController[] = [];

  public _svgPath: VinesEdgePath = [];

  public children: VinesNode[];

  public executionStatus: VinesNodeStatus = 'DEFAULT';

  public executionTask: VinesNodeExecutionTask = this.defaultRunningTask;

  protected readonly _vinesCore: VinesCore;

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
      toast.error(`创建失败！不支持的工具类型: ${type}`);
      return new VinesNode.classMap[TaskType.SIMPLE](task, vinesCore);
    }
    return new VinesNode.classMap[type](task, vinesCore);
  }

  static createFakeNode(vinesCore: VinesCore): VinesNode {
    return VinesNode.create(
      {
        name: 'fake_node',
        taskReferenceName: 'fake_node_' + createNanoId(),
        type: TaskType.SIMPLE,
      },
      vinesCore,
    );
  }

  // region Tools
  /**
   * 获取所有子节点（包括子节点的子节点）
   * */
  public getAllChildren(): VinesNode[] {
    return this.children.flatMap((it) => [it, it.getAllChildren().flat()]).flat();
  }

  /**
   * 浅获取当前节点的子节点（不包括子节点的子节点）
   * */
  get childNodes(): VinesNode[] {
    return this.getAllChildren().filter((childNode) => childNode.needRenderChildren && childNode.needRender);
  }

  /**
   * 深度获取节点的子节点（过滤不需要渲染子节点的子节点）
   * */
  public getChildren(): VinesNode[] {
    return this.children.map((it) => (!it.needRenderChildren ? it.getChildren() : it)).flat();
  }

  /**
   * 是否需要渲染子节点
   * */
  get needRenderChildren(): boolean {
    return true;
  }

  /**
   * 获取节点用户自定义数据
   * */
  get customData(): IVinesNodeCustomData {
    const alias = ((this._task as TaskDefTypes & { __alias?: IVinesNodeCustomData })?.__alias ??
      {}) as IVinesNodeCustomData;
    return {
      icon: alias?.icon ?? null,
      title: alias?.title ?? null,
      description: alias?.description ?? null,
    };
  }

  /**
   * 获取节点原始 TaskDef
   * */
  getRaw(): TaskDefTypes {
    return this._task;
  }

  updateRaw(nodeId: string, task: T): boolean {
    if (this.id === nodeId) {
      this._task = task;
      return true;
    } else {
      for (const child of this.children) {
        const result = child.updateRaw(nodeId, task);
        if (result) {
          return true;
        }
      }
      return false;
    }
  }
  // endregion

  // region 渲染节点
  /**
   * 渲染节点
   * @param position 当前画笔位置
   * @param path 路径
   * @param isLastNode 是否是最后一个节点
   */
  public render(position: IVinesNodePosition, path?: VinesNode[], isLastNode = false) {
    void path;
    void isLastNode;
    this._svgPath = [];
    this.position = { ...position };

    if (this._vinesCore.renderDirection === 'horizontal') {
      return this.renderHorizontal(position, path, isLastNode);
    }

    position.y += this.size.height + 80;
  }

  /**
   *  水平渲染节点
   *  @param position 当前画笔位置
   *  @param _path 路径
   *  @param _isLastNode 是否是最后一个节点
   * */
  public renderHorizontal(position: IVinesNodePosition, _path?: VinesNode[], _isLastNode = false) {
    position.x += this.size.width + 80;
  }

  /**
   *  获取节点边界
   *  @param children 子节点
   * */
  getBoundary(children = this.children.filter((node) => node.needRender)): IVinesNodeBoundary {
    return {
      left: Math.min(this.position.x, min(children.map((it) => it.getBoundary().left)) ?? 99999999),
      right: Math.max(this.position.x, max(children.map((it) => it.getBoundary().right)) ?? -99999999),
      top: Math.min(this.position.y, min(children.map((it) => it.getBoundary().top)) ?? 99999999),
      bottom: Math.max(this.position.y, max(children.map((it) => it.getBoundary().bottom)) ?? -99999999),
    };
  }

  get entryPoint(): IVinesNodeEntryPoint {
    const centerX = this.size.width / 2;
    const centerY = this.size.height / 2;
    if (this._vinesCore.renderDirection === 'vertical') {
      return {
        in: {
          x: this.position.x + centerX,
          y: this.position.y,
        },
        out: {
          x: this.position.x + centerX,
          y: this.position.y + this.size.height,
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

  /**
   *  移动节点
   *  @param offsetX x 轴偏移量
   *  @param offsetY y 轴偏移量
   * */
  move(offsetX: number, offsetY = 0) {
    if (offsetX) {
      this.position.x += offsetX;
      this.controller.forEach((it) => (it.position.x += offsetX));
    }
    if (offsetY) {
      this.position.y += offsetY;
      this.controller.forEach((it) => (it.position.y += offsetY));
    }

    this.children.forEach((it) => it.move(offsetX, offsetY));
  }

  /**
   * 是否需要渲染该节点
   * */
  get needRender(): boolean {
    return true;
  }
  // endregion

  // region 节点连接线（SVG）
  /**
   * 渲染节点连接线
   * @param lastNode 是否是最后一个节点
   * */
  renderEdge(lastNode = false) {
    this.clearSvg();

    if (this._vinesCore.renderDirection === 'horizontal') return this.renderHorizontalEdge(lastNode);

    const centerX = this.size.width / 2;
    const nodeHeight = this.size.height;
    this._svgPath = lastNode
      ? []
      : drawLine(
          this.position.x + centerX,
          this.position.y + nodeHeight,
          this.position.x + centerX,
          this.position.y + nodeHeight + 80,
        );
  }

  /**
   * 水平渲染节点连接线
   * @param lastNode 是否是最后一个节点
   * */
  renderHorizontalEdge(lastNode = false) {
    const centerY = this.size.height / 2;
    const nodeWidth = this.size.width;

    this._svgPath = lastNode
      ? []
      : drawLine(
          this.position.x + nodeWidth,
          this.position.y + centerY,
          this.position.x + nodeWidth + 80,
          this.position.y + centerY,
        );
  }

  /**
   *  清理 SVG
   * */
  public clearSvg() {
    this._svgPath = [];
  }

  /**
   * 获取节点连接线
   * */
  svgPath(): [string, VinesEdgePath][] {
    return [[this.id, this._svgPath]];
  }
  // endregion

  // region 节点控制器
  /**
   * 渲染节点控制器
   * */
  renderController() {
    const useHorizontal = this._vinesCore.renderDirection === 'horizontal';
    const direction = useHorizontal ? -1 : 1;
    const offsetX = useHorizontal ? 6 : 0;
    const offsetY = useHorizontal ? 0 : 6;

    const entryPointOut = this.entryPoint.out;
    this.controller = [
      {
        position: {
          x: entryPointOut.x - 16 * direction - offsetX,
          y: entryPointOut.y + 16 * direction - offsetY,
        },
        icon: '+',
        onClick: () =>
          VinesEvent.emit('flow-select-nodes', {
            _wid: this._vinesCore.workflowId,
            targetNodeId: this.id,
          }),
      },
    ];
  }

  /**
   *  获取节点控制器结构
   * */
  public getController(): IVinesNodeController[] {
    return this.controller;
  }
  // endregion

  // region CURD
  public findChildById(id: string): VinesNode | undefined {
    if (this.id === id) return this;
    if (isArray(this.children)) {
      for (const child of this.children) {
        const result = child.findChildById(id);
        if (result) return result;
      }
    }
    return void null;
  }

  public insertChild(params: IVinesInsertChildParams): VinesNode | VinesNode[] | null {
    const { targetId, path = [], insertBefore = false } = params;
    let { node } = params;
    const index = this.children.findIndex((childNode) => childNode.id === targetId);
    if (index !== -1) {
      // 嵌套的循环 no
      const isDoWhileNode = Array.isArray(node)
        ? node.some((it) => it.type === TaskType.DO_WHILE)
        : node.type === TaskType.DO_WHILE;
      if (
        path.some((nodeChild) => nodeChild.type === TaskType.DO_WHILE) &&
        isDoWhileNode &&
        this.type !== TaskType.SUB_WORKFLOW
      ) {
        // 构造嵌套循环的子流程
        const tasks = [...(Array.isArray(node) ? node.map((it) => it.getRaw()) : [node.getRaw()])];
        node = VinesNode.create(createSubWorkflowDef(tasks), this._vinesCore);
      }
      const isFakeNode = +/fake_node/.test(targetId);
      if (insertBefore) {
        this.children.splice(index, isFakeNode, ...(Array.isArray(node) ? node : [node]));
      } else {
        this.children.splice(index + 1 - isFakeNode, isFakeNode, ...(Array.isArray(node) ? node : [node]));
      }
      return node;
    }
    for (const childNode of this.children) {
      if (childNode.insertChild({ targetId, node, path: [childNode, ...path], insertBefore })) {
        return node;
      }
    }
    return null;
  }

  public deleteChild(targetId: string, path: VinesNode[] = []) {
    const index = this.children.findIndex((childNode) => childNode.id === targetId);

    if (index !== -1) {
      this.children[index].destroy();
      this.children.splice(index, 1);
      if (!this.children.length) {
        this.children.splice(index, 0, VinesNode.createFakeNode(this._vinesCore));
      }
      return true;
    }

    for (const childNode of this.children) {
      if (childNode.deleteChild(targetId, path.splice(0, 0, this))) {
        return true;
      }
    }

    return false;
  }

  public destroy() {
    return this.children.map((childNode) => childNode.destroy());
  }

  public check(): boolean {
    return this.children.some((childNode) => childNode.check());
  }

  public afterCreate(): VinesNode | VinesNode[] {
    return this;
  }

  public insertAfter() {
    return void 0;
  }

  public moveAfter(targetType?: IVinesMoveAfterTargetType) {
    return void targetType;
  }

  public deleteAfter() {
    return void 0;
  }

  get isFake() {
    return this.id.startsWith('fake_node_');
  }
  // endregion

  // region Variable
  public variable(): { variables: IVinesVariable[]; mapper: VinesVariableMapper } {
    const tool = this._vinesCore.getTool(this._task?.name ?? '');
    if (!tool) {
      return {
        variables: [],
        mapper: new Map(),
      };
    }

    const customData = this.customData;
    const nodeTitle = customData?.title ?? tool.displayName ?? '';
    const nodeDesc = customData?.description ?? tool.description ?? '';
    const nodeIcon = customData?.icon ?? tool.icon ?? '';

    const variables = this._vinesCore.generateVariable(
      {
        id: this.id,
        name: getI18nContent(nodeTitle) ?? '',
        desc: getI18nContent(nodeDesc) ?? '',
        icon: nodeIcon,
      },
      this.id,
      tool.output,
    );
    const mapper = this._vinesCore.generateVariableMapper(variables, getI18nContent(nodeTitle) ?? '');

    return { variables, mapper };
  }
  // endregion

  // region Runner
  public clearExecutionStatus() {
    this.executionStatus = 'DEFAULT';
  }

  public clearRunningTask() {
    this.executionTask = this.defaultRunningTask;
  }

  public async updateStatus(task: VinesNodeExecutionTask): Promise<boolean> {
    this.executionTask = { ...task, originStatus: task.status };
    this.executionStatus = task.status;
    return false;
  }

  private get defaultRunningTask(): VinesNodeExecutionTask {
    return {
      ...this._task,
      status: 'DEFAULT',
      originStatus: 'SCHEDULED',
    };
  }
  // endregion

  public checkChildren(path: VinesNode[] = []): boolean {
    return this.children.some((childNode) => childNode.checkChildren([childNode, ...path]));
  }

  public restoreChildren(path: VinesNode[] = []): boolean {
    return this.children.some((childNode) => childNode.restoreChildren([childNode, ...path]));
  }
}

// 「控制流程节点」公用逻辑
export class ControlFlowVinesNode<T extends MonkeyTaskDefTypes = MonkeyTaskDefTypes> extends VinesNode<T> {
  extraSvgPath: [string, VinesEdgePath][] = [];

  override svgPath() {
    return ([...this.extraSvgPath, [this.id, this._svgPath]] as [string, VinesEdgePath][]).reverse();
  }

  renderChildren(
    position: IVinesNodePosition,
    path: VinesNode[] = [],
    children = this.children.filter((node) => node.needRender),
  ) {
    void path;
    for (const it of children.slice(0, -1)) {
      it.clearSvg();
      it.render(position);
    }
    const lastChild = Array.from(children).pop();
    lastChild?.clearSvg();
    lastChild?.render(position);
  }

  clearSvg() {
    super.clearSvg();
    this.extraSvgPath = [];
  }

  renderHead(children: VinesNode[] = this.children, centerYOffset = 0): IVinesEdge[] {
    // draw start
    const entryPointIn = children?.[0]?.entryPoint.in ?? { x: 0, y: 0 };
    if (this._vinesCore.renderDirection === 'vertical') {
      return drawSmoothLine({
        sourceX: this.position.x + this.size.width / 2,
        sourceY: this.position.y + this.size.height,
        targetX: entryPointIn.x,
        targetY: entryPointIn.y,
        centerY: centerYOffset ? entryPointIn.y - centerYOffset : void 0,
      });
    } else {
      return drawSmoothLine({
        sourceX: this.position.x + this.size.width,
        sourceY: this.position.y + this.size.height / 2,
        targetX: entryPointIn.x,
        targetY: entryPointIn.y,
        sourcePosition: VinesSVGPosition.Right,
        targetPosition: VinesSVGPosition.Left,
        centerX: entryPointIn.x - centerYOffset,
      });
    }
  }
}
