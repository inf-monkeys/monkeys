import { type DoWhileTaskDef, TaskType } from '@io-orkes/conductor-javascript';

import { VinesCore } from '@/package/vines-flow/core';
import { SubWorkflowNode } from '@/package/vines-flow/core/nodes';
import { ControlFlowVinesNode, VinesNode } from '@/package/vines-flow/core/nodes/base.ts';
import {
  drawLine,
  drawPureLine,
  drawPureSmoothLine,
  drawSmoothLine,
  VinesSVGPosition,
} from '@/package/vines-flow/core/nodes/svg-utils.ts';
import { IVinesCollectDoWhileOutputTaskDef, IVinesNodePosition } from '@/package/vines-flow/core/nodes/typings.ts';
import { IVinesInsertChildParams } from '@/package/vines-flow/core/typings.ts';
import { createTask } from '@/package/vines-flow/core/utils.ts';
import VinesEvent from '@/utils/events';

export class DoWhileNode extends ControlFlowVinesNode<DoWhileTaskDef> {
  static {
    VinesNode.register(TaskType.DO_WHILE, DoWhileNode);
  }

  private padding = 20;

  constructor(task: DoWhileTaskDef, vinesCore: VinesCore) {
    super(task, vinesCore);
    this.parseChildren((task as DoWhileTaskDef).loopOver);
  }

  private parseChildren(loopOver: DoWhileTaskDef['loopOver']) {
    this.children.push(...loopOver.map((it) => VinesNode.create(it, this._vinesCore)));
  }

  override getRaw() {
    (this._task as DoWhileTaskDef).loopOver = this.children.map((it) => it.getRaw());
    return this._task;
  }

  override afterCreate(): VinesNode | VinesNode[] {
    const node = super.afterCreate() as DoWhileNode;

    const CollectDoWhileOutputTool = this._vinesCore.getTool('collect_dowhile_output');
    if (CollectDoWhileOutputTool) {
      const rawTask = createTask(CollectDoWhileOutputTool) as IVinesCollectDoWhileOutputTaskDef;
      rawTask.inputParameters.doWhileTaskReferenceName = this.id;
      return [node, VinesNode.create(rawTask, this._vinesCore)];
    }

    return [node];
  }

  // region Render
  override render(position: IVinesNodePosition, path?: VinesNode[], isLastNode = false) {
    this.clearSvg();
    this.position.x = position.x;
    this.position.y = position.y;

    if (this._vinesCore.renderDirection === 'horizontal') return this.renderHorizontal(position, path, isLastNode);

    this.controller = [
      {
        position: {
          x: this.entryPoint.out.x - 16,
          y: this.position.y + this.size.height + 8,
        },
        icon: '+',
        onClick: () =>
          VinesEvent.emit('flow-select-nodes', {
            selectMode: true,
            targetNodeId: this.children?.[0]?.id ?? this.id,
          }),
      },
    ];

    const childOffset = this.size.width / 2 + this.padding;

    position.x += childOffset;
    position.y += this.size.height + 82;
    this.renderChildren(position, path);
    const { left } = this.getBoundary();
    const offset = left - this.position.x;
    if (offset < childOffset) {
      this.children.forEach((it) => it.move(childOffset - offset));
    }

    const entryPointOut = this.entryPoint.out;
    position.x -= childOffset;
    position.y = entryPointOut.y + (isLastNode ? 20 : 80);

    this.controller.push({
      position: {
        x: entryPointOut.x - 16,
        y: entryPointOut.y + 10,
      },
      icon: '+',
      onClick: () =>
        VinesEvent.emit('flow-select-nodes', {
          selectMode: true,
          targetNodeId: this.id,
        }),
    });
  }

  override async renderHorizontal(position: IVinesNodePosition, path?: VinesNode[], isLastNode = false) {
    this.controller = [
      {
        position: {
          x: this.position.x + this.size.width + 8,
          y: this.entryPoint.out.y - 16,
        },
        icon: '+',
        onClick: () =>
          VinesEvent.emit('flow-select-nodes', {
            selectMode: true,
            targetNodeId: this.children?.[0]?.id ?? this.id,
          }),
      },
    ];

    const childOffset = -(this.size.height / 2 + this.padding);

    position.x += this.size.width + 82;
    position.y += childOffset;
    await this.renderChildren(position, path);
    const { bottom } = this.getBoundary();
    const offset = bottom - this.position.y;
    if (offset > childOffset) {
      this.children.forEach((it) => it.move(0, childOffset - offset));
    }

    const entryPointOut = this.entryPoint.out;
    position.x = entryPointOut.x + (isLastNode ? 20 : 80);
    position.y -= childOffset;

    this.controller.push({
      position: {
        x: entryPointOut.x + 10,
        y: entryPointOut.y - 16,
      },
      icon: '+',
      onClick: () =>
        VinesEvent.emit('flow-select-nodes', {
          selectMode: true,
          targetNodeId: this.id,
        }),
    });
  }

  override renderEdge(lastNode = false) {
    this._svgPath = this.renderHead(this.childNodes, 32);
    this.children.forEach((it, index) => it.renderEdge(index === this.children.length - 1));

    if (this._vinesCore.renderDirection === 'horizontal') return this.renderHorizontalEdge(lastNode);

    const lastChild = this.children.filter((it) => it.needRender).at(-1);

    if (lastChild) {
      const lastChildEntry = lastChild.entryPoint;

      const nodeHeight = this.size.height;
      const pointX = this.position.x - 60 - this.padding;

      this.extraSvgPath = [
        [
          lastChild.id,
          [
            ...drawSmoothLine({
              sourceX: lastChildEntry.out.x,
              sourceY: lastChildEntry.out.y,
              targetX: pointX,
              targetY: lastChildEntry.out.y + 30,
              targetPosition: VinesSVGPosition.Bottom,
            }),
            drawPureLine(pointX, this.position.y + nodeHeight + 80),
            ...drawPureSmoothLine({
              sourceX: pointX,
              sourceY: this.position.y + nodeHeight + 80,
              targetX: this.position.x + this.size.width / 3.2,
              targetY: this.position.y + nodeHeight + 50,
              targetPosition: VinesSVGPosition.Left,
              sourcePosition: VinesSVGPosition.Top,
            }),
          ],
        ],
      ];
    }

    if (!lastNode) {
      this.extraSvgPath.push([
        this.id + '_end',
        drawLine(this.entryPoint.out.x, this.entryPoint.out.y, this.entryPoint.out.x, this.entryPoint.out.y + 80),
      ]);
    }
  }

  override renderHorizontalEdge(lastNode = false) {
    const lastChild = this.children.filter((it) => it.needRender).at(-1);

    if (lastChild) {
      const lastChildEntry = lastChild.entryPoint;

      const nodeWidth = this.size.width;
      const nodeHeight = this.size.height;
      const pointY = this.position.y + nodeHeight + 40 + this.padding;

      this.extraSvgPath = [
        [
          lastChild.id,
          [
            ...drawSmoothLine({
              sourceX: lastChildEntry.out.x,
              sourceY: lastChildEntry.out.y,
              targetX: lastChildEntry.out.x + 30,
              targetY: pointY,
              sourcePosition: VinesSVGPosition.Right,
              targetPosition: VinesSVGPosition.Right,
            }),
            drawPureLine(this.position.x + nodeWidth + 80, pointY),
            ...drawPureSmoothLine({
              sourceX: this.position.x + nodeWidth + 80,
              sourceY: pointY,
              targetX: this.position.x + nodeWidth + 50,
              targetY: this.position.y + this.size.height / 1.4,
              targetPosition: VinesSVGPosition.Bottom,
              sourcePosition: VinesSVGPosition.Left,
            }),
          ],
        ],
      ];
    }

    if (!lastNode) {
      this.extraSvgPath.push([
        this.id + '_end',
        drawLine(this.entryPoint.out.x, this.entryPoint.out.y, this.entryPoint.out.x + 80, this.entryPoint.out.y),
      ]);
    }
  }

  override renderController() {
    this.children.forEach((it) => it.renderController());
  }

  override get entryPoint() {
    const lastChildEntry = this.children.filter((it) => it.needRender).at(-1)?.entryPoint;
    if (this._vinesCore.renderDirection === 'vertical') {
      const centerX = this.size.width / 2;
      const inPoint = { x: this.position.x + centerX, y: this.position.y };
      const outPoint = { x: this.position.x + centerX, y: (lastChildEntry?.out.y ?? 0) + 50 };
      return {
        in: inPoint,
        out: outPoint,
      };
    } else {
      const centerY = this.size.height / 2;
      const inPoint = { x: this.position.x, y: this.position.y + centerY };
      const outPoint = { x: (lastChildEntry?.out.x ?? 0) + 50, y: this.position.y + centerY };
      return {
        in: inPoint,
        out: outPoint,
      };
    }
  }
  // endregion

  // region CRUD
  override insertChild(params: IVinesInsertChildParams): VinesNode | VinesNode[] | null {
    const { targetId, node, path, insertBefore = false } = params;
    // 如果插入的节点是嵌套子流程，那么就插入到子流程中
    const subWorkflowList = this.children.filter(
      (childNode) => childNode instanceof SubWorkflowNode && childNode.isNested,
    ) as SubWorkflowNode[];
    const batchInsertResults = subWorkflowList.map((it) =>
      it.insertChild({
        targetId,
        node,
        path,
        insertBefore,
      }),
    );
    const insertInSubWorkflow = batchInsertResults.find(Boolean);
    return insertInSubWorkflow ?? super.insertChild(params);
  }

  override deleteChild(targetId: string, path: VinesNode[] = []) {
    // 判断是否存在嵌套 do-while 子流程
    const doWhileSubWorkflows = this.children.filter(
      (childNode) => childNode instanceof SubWorkflowNode && childNode.isNested,
    );
    if (!doWhileSubWorkflows.length || this.children.some((it) => it.id === targetId)) {
      // 不存在则执行普通删除
      return super.deleteChild(targetId, path);
    }
    // 如果是，调嵌套子流程的 DeleteChild
    for (const doWhileSubWorkflow of doWhileSubWorkflows) {
      if (doWhileSubWorkflow.deleteChild(targetId, path)) {
        // 如果删完了还剩一个节点，而且这个节点是 fake 节点，那么自毁
        if (doWhileSubWorkflow.children.length === 1 && doWhileSubWorkflow.children[0].isFake) {
          doWhileSubWorkflow.destroy();
          // 清除当前 children 的子流程 node
          super.deleteChild(doWhileSubWorkflow.id);
        }

        // 当删除完之后彻底没有任何节点的时候，插入一个 fake 节点
        if (!this.children.length) {
          this.children = [VinesNode.createFakeNode(this._vinesCore)];
        }
        return true;
      }
    }
    return false;
  }
  // endregion

  override destroy() {
    const RelevanceNode = this._vinesCore
      .getAllNodes()
      .find(
        (it) => (it._task as IVinesCollectDoWhileOutputTaskDef)?.inputParameters?.doWhileTaskReferenceName === this.id,
      );
    RelevanceNode && this._vinesCore.deleteNode(RelevanceNode.id);

    return super.destroy();
  }
}
