import { MonkeyTaskDefTypes } from '@inf-monkeys/vines';

import { VinesBase } from '@/package/vines-flow/core/base';
import { EndPointNode, VinesNode } from '@/package/vines-flow/core/nodes';
import { IVinesNodePosition, IVinesWorkflowUpdate } from '@/package/vines-flow/core/nodes/typings.ts';
import { VinesTools } from '@/package/vines-flow/core/tools';
import { IVinesFlowRenderOptions, IVinesFlowRenderType } from '@/package/vines-flow/core/typings.ts';
import VinesEvent from '@/utils/events';

export class VinesCore extends VinesTools(VinesBase) {
  public workflowId: string | undefined;

  public nodes: VinesNode[] = [];

  public tasks: MonkeyTaskDefTypes[] = [];

  public renderOptions: IVinesFlowRenderOptions = {
    direction: 'vertical',
    type: IVinesFlowRenderType.SIMPLIFY,
  };

  public canvasSize = { width: 0, height: 0 };

  private position: IVinesNodePosition = { x: 0, y: 0 };

  private init() {
    this.nodes = this.tasks.map((it) => VinesNode.create(it, this));
    this.nodes.splice(0, 0, EndPointNode.createStart(this));
    this.nodes.push(EndPointNode.createEnd(this));
  }

  public update({ workflow, workflowId, tasks }: IVinesWorkflowUpdate, render = true) {
    if (workflow) {
      workflow?.workflowDef?.tasks && (this.tasks = workflow.workflowDef.tasks.filter((task) => task));
      workflow?.workflowId && (this.workflowId = workflow.workflowId);
    }
    workflowId && (this.workflowId = workflowId);
    tasks && (this.tasks = tasks.filter((task) => task));

    this.init();
    render && this.render();
    this.emit('update');
  }

  public render() {
    this.position = { x: 0, y: 0 };

    const firstNode = this.nodes.at(0);
    const firstNodeWidth = firstNode?.size.width ?? 80;
    const firstNodeHeight = firstNode?.size.height ?? 80;

    let minLeft = 0;
    let maxRight = firstNodeWidth;
    let minTop = 0;
    let maxBottom = firstNodeHeight;

    const useHorizontal = this.renderDirection === 'horizontal';

    for (const node of this.nodes) {
      if (!node.needRender) continue;

      node.render(this.position);

      const nodeBoundary = node.getBoundary();
      minLeft = Math.min(minLeft, nodeBoundary.left);
      maxRight = Math.max(maxRight, nodeBoundary.right);
      minTop = Math.min(minTop, nodeBoundary.top);
      maxBottom = Math.max(maxBottom, nodeBoundary.bottom);
    }

    const hasLeft = minLeft < 0;
    const hasRight = maxRight > firstNodeWidth && !useHorizontal;
    const hasTop = minTop < 0 && useHorizontal;
    const hasMinTop = Math.abs(minTop) !== 0;

    const offsetWidth = hasRight ? firstNodeWidth + 5 : 0;
    const offsetHeight = hasMinTop ? 62 : 0;
    const offsetLeft = Math.abs(minLeft) + offsetWidth;
    const offsetTop = Math.abs(minTop) + offsetHeight;
    for (const node of this.nodes) {
      node.move(offsetLeft, offsetTop);
    }

    this.canvasSize = {
      width:
        maxRight +
        offsetLeft +
        offsetWidth +
        (useHorizontal ? firstNodeWidth : 0) +
        (!useHorizontal && hasLeft ? firstNodeWidth : 0),
      height:
        maxBottom +
        offsetTop +
        (useHorizontal ? 0 : firstNodeHeight) +
        (useHorizontal && hasTop ? 62 : 0) +
        (hasMinTop ? firstNodeHeight : 0),
    };

    this.nodes.forEach((it) => {
      it.renderEdge();
      it.renderController();
    });

    setTimeout(() => VinesEvent.emit('canvas-auto-zoom'), 80);
  }

  /**
   *  获取所有节点
   *  @param filterRenderChildren 是否过滤不需要渲染的子节点
   * */
  public getAllNodes(filterRenderChildren = true) {
    if (!filterRenderChildren) return this.nodes.flatMap((it) => [it, it.getAllChildren().flat()]).flat();
    return this.nodes
      .flatMap((it) => [it, it.childNodes.flat()])
      .flat()
      .filter((it) => it.needRender);
  }

  // region Tools
  get renderDirection() {
    return this.renderOptions.direction;
  }
  // endregion
}
