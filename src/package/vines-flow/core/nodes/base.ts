import { MonkeyTaskDefTypes } from '@inf-monkeys/vines';
import { TaskDefTypes, TaskType } from '@io-orkes/conductor-javascript';
import { max, min } from 'lodash';

import { VinesCore } from '@/package/vines-flow/core';
import {
  IVinesNodeBoundary,
  IVinesNodeController,
  IVinesNodeCustomData,
  IVinesNodeEntryPoint,
  IVinesNodePosition,
  IVinesNodeSize,
  VinesEdgePath,
  VinesTask,
} from '@/package/vines-flow/core/nodes/typings.ts';
import { drawLine } from '@/package/vines-flow/core/nodes/utils.ts';
import VinesEvent from '@/utils/events.ts';

export type NodeClass = new (task: any, vinesCore: VinesCore) => VinesNode;

export class VinesNode<T extends VinesTask = VinesTask> {
  public id: string;

  public type: TaskType;

  public _task: T;

  public size: IVinesNodeSize = { width: 80, height: 80 };

  public position: IVinesNodePosition = { x: 0, y: 0 };

  public controller: IVinesNodeController[] = [];

  private _svgPath: VinesEdgePath = [];

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

  get customData(): IVinesNodeCustomData {
    const alias = ((this._task as TaskDefTypes & { __alias?: IVinesNodeCustomData })?.__alias ??
      {}) as IVinesNodeCustomData;
    return {
      icon: alias?.icon ?? null,
      title: alias?.title ?? null,
      description: alias?.description ?? null,
    };
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
  private clearSvg() {
    this._svgPath = [];
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
            selectMode: true,
            targetNodeId: this.id,
          }),
      },
    ];
  }

  /**
   *  获取节点控制器结构
   * */
  getController(): IVinesNodeController[] {
    return this.controller;
  }
  // endregion
}

// 「控制流程节点」公用逻辑
export class ControlFlowVinesNode<T extends MonkeyTaskDefTypes = MonkeyTaskDefTypes> extends VinesNode<T> {}
