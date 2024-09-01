import { get, isEmpty, merge } from 'lodash';

import { VinesCore } from '@/package/vines-flow/core';
import { ControlFlowVinesNode, VinesNode } from '@/package/vines-flow/core/nodes/base.ts';
import { drawSmoothLine, VinesSVGPosition } from '@/package/vines-flow/core/nodes/svg-utils.ts';
import { IVinesNodePosition } from '@/package/vines-flow/core/nodes/typings.ts';
import { IVinesInsertChildParams } from '@/package/vines-flow/core/typings.ts';
import { getBoundary } from '@/package/vines-flow/core/utils.ts';
import { SwitchTaskDef, TaskType } from '@/package/vines-flow/share/types.ts';
import VinesEvent from '@/utils/events.ts';

export class SwitchNode extends ControlFlowVinesNode<SwitchTaskDef> {
  static {
    VinesNode.register(TaskType.SWITCH, SwitchNode);
  }

  selectedCase?: string;

  private decisions: Record<string, VinesNode[]> = {};

  public readonly maxDecision = 20;

  constructor(task: SwitchTaskDef, vinesCore: VinesCore) {
    super(task, vinesCore);
    this.parseChildren((task as SwitchTaskDef).decisionCases);
  }

  private parseChildren(decisionCases: SwitchTaskDef['decisionCases']) {
    const parsedBranch: string[] = [];
    for (const [branchName, branchTasks] of Object.entries(decisionCases)) {
      parsedBranch.push(branchName);
      if (this.decisions[branchName]?.length) {
        branchTasks.forEach((it) => {
          const nodeId = it.taskReferenceName;
          const node = this.decisions[branchName].find((node) => node.id === nodeId);
          if (node) {
            node.updateRaw(nodeId, it);
          } else {
            this.decisions[branchName].push(VinesNode.create(it, this._vinesCore));
          }
        });
      } else {
        this.decisions[branchName] = branchTasks.map((it) => VinesNode.create(it, this._vinesCore));
      }
    }

    let needRender = false;
    for (const branchName of Object.keys(this.decisions)) {
      if (!parsedBranch.includes(branchName)) {
        this.deleteDecision(branchName);
        needRender = true;
      }
    }

    this.children = Object.values(this.decisions).flat();

    if (needRender) {
      this._vinesCore.render();
    }
  }

  override check(): boolean {
    const parameters = get(this._task, 'inputParameters.parameters', {});
    if (!isEmpty(parameters)) {
      merge(this._task, { inputParameters: parameters });
    }

    // this._task = omit(this._task, ['inputParameters.parameters']) as SwitchTaskDef;

    return super.check();
  }

  // region Render
  override render(position: IVinesNodePosition, path: VinesNode[] = [], isLastNode = false) {
    if (position.x === -999999 || position.y === -999999) return;
    void isLastNode;

    this.position.x = position.x;
    this.position.y = position.y;

    if (this._vinesCore.renderDirection === 'horizontal') return this.renderHorizontal(position, path, isLastNode);

    const nodeWidth = this.size.width;
    position.y += this.size.height + 102;

    const decisionLength = Object.keys(this.decisions).length;

    this.controller = [
      {
        disabled: decisionLength + 1 > this.maxDecision,
        position: {
          x: this.entryPoint.out.x - 16,
          y: this.position.y + this.size.height + 8,
        },
        icon: '+',
        needConfirmation: '确定要新建分支吗？',
        onClick: () => {
          this.insertDecisionUseIncrement();
          this._vinesCore.emit('update', this._vinesCore.getRaw());
        },
      },
    ];

    const { leftBranches, rightBranches, middleBranches } = this.getDecisionChildren();

    const offset =
      nodeWidth + (this.size.width !== 80 ? (decisionLength === 2 ? 0 : 80) : 110 + (decisionLength === 2 ? 0 : 190));

    let originPosition = { ...position };

    let leftBaseline = this.position.x;
    let rightBaseline = this.position.x;
    for (const middleBranch of middleBranches) {
      this.renderChildren(
        originPosition,
        path,
        middleBranch.filter((node) => node.needRender),
      );
      const { left, right } = getBoundary(middleBranch);
      leftBaseline = left;
      rightBaseline = right;
    }

    for (const leftBranch of leftBranches) {
      originPosition.y = position.y;
      originPosition.x -= offset;

      this.renderChildren(
        originPosition,
        path,
        leftBranch.filter((node) => node.needRender),
      );
      const { left, right } = getBoundary(leftBranch);

      let finalOffset = 0;
      if (right > leftBaseline) {
        finalOffset = right - leftBaseline + offset;
      } else {
        const currentOffset = leftBaseline - right;
        if (currentOffset < offset) {
          finalOffset = Math.abs(offset - currentOffset);
        }
      }
      leftBaseline = left;
      leftBranch.forEach((it) => it.move(-finalOffset));
      originPosition.x -= finalOffset;
      leftBaseline -= finalOffset;
    }
    originPosition = { ...position };
    for (const rightBranch of rightBranches) {
      originPosition.y = position.y;
      originPosition.x += offset;

      this.renderChildren(
        originPosition,
        path,
        rightBranch.filter((node) => node.needRender),
      );
      const { left, right } = getBoundary(rightBranch);
      let finalOffset = 0;
      if (left < rightBaseline) {
        finalOffset = rightBaseline - left + offset;
      } else {
        const currentOffset = left - rightBaseline;
        if (currentOffset < offset) {
          finalOffset = Math.abs(offset - currentOffset);
        }
      }
      rightBaseline = right;
      rightBranch.forEach((it) => it.move(finalOffset));
      originPosition.x += finalOffset;
      rightBaseline += finalOffset;
    }

    position.y = this.entryPoint.out.y + 20;
  }

  override renderHorizontal(position: IVinesNodePosition, path: VinesNode[] = [], _isLastNode = false) {
    const nodeHeight = this.size.height;

    position.x += this.size.width + 102;

    const decisionLength = Object.keys(this.decisions).length;

    this.controller = [
      {
        disabled: decisionLength + 1 > this.maxDecision,
        position: {
          x: this.entryPoint.in.x + this.size.width + 8,
          y: this.position.y + this.size.height / 2 - 16,
        },
        icon: '+',
        needConfirmation: '确定要新建分支吗？',
        onClick: () => {
          this.insertDecisionUseIncrement();
          this._vinesCore.emit('update', this._vinesCore.getRaw());
        },
      },
    ];

    const { leftBranches: topBranches, rightBranches: bottomBranches, middleBranches } = this.getDecisionChildren();

    const offset = nodeHeight + 80;

    let originPosition = { ...position };

    let bottomBaseline = this.position.y;
    let topBaseline = this.position.y;
    for (const middleBranch of middleBranches) {
      this.renderChildren(
        originPosition,
        path,
        middleBranch.filter((node) => node.needRender),
      );
      const { bottom, top } = getBoundary(middleBranch);
      bottomBaseline = bottom;
      topBaseline = top;
    }

    for (const topBranch of topBranches) {
      originPosition.x = position.x;
      originPosition.y -= offset;

      this.renderChildren(
        originPosition,
        path,
        topBranch.filter((node) => node.needRender),
      );
      const { top, bottom } = getBoundary(topBranch);

      let finalOffset = 0;
      if (bottom > topBaseline) {
        finalOffset = bottom - topBaseline + offset;
      } else {
        const currentOffset = topBaseline - bottom;
        if (currentOffset < offset) {
          finalOffset = Math.abs(offset - currentOffset);
        }
      }
      topBaseline = top;
      topBranch.forEach((it) => it.move(0, -finalOffset));
      originPosition.y -= finalOffset;
      topBaseline -= finalOffset;
    }

    originPosition = { ...position };

    for (const bottomBranch of bottomBranches) {
      originPosition.x = position.x;
      originPosition.y += offset;

      this.renderChildren(
        originPosition,
        path,
        bottomBranch.filter((node) => node.needRender),
      );
      const { top, bottom } = getBoundary(bottomBranch);
      let finalOffset = 0;
      if (top < bottomBaseline) {
        finalOffset = bottomBaseline - top + offset;
      } else {
        const currentOffset = top - bottomBaseline;
        if (currentOffset < offset) {
          finalOffset = Math.abs(offset - currentOffset);
        }
      }
      bottomBaseline = bottom;
      bottomBranch.forEach((it) => it.move(0, finalOffset));
      originPosition.y += finalOffset;
      bottomBaseline += finalOffset;
    }

    position.x = this.entryPoint.out.x + 20;
  }

  override renderEdge(lastNode = false) {
    void lastNode;
    this.clearSvg();
    const flattenBranch = [...Object.entries(this.decisions)];
    flattenBranch.forEach(([branchName, branch]) => {
      this.extraSvgPath.push([`${this.id}_${branchName}`, this.renderHead(branch, 50)]);
      branch.forEach((it, index) => it.renderEdge(index === branch.length - 1));
    });

    if (this._vinesCore.renderDirection === 'horizontal') return this.renderHorizontalEdge();

    const maxY = flattenBranch
      .map(([, it]) => it.filter((node) => node.needRender).at(-1))
      .reduce((previousValue, currentValue) => Math.max(previousValue, currentValue?.entryPoint.out.y ?? 0), 0);
    flattenBranch.forEach(([, branch]) => {
      const lastChild = branch.filter((node) => node.needRender).at(-1);
      if (lastChild) {
        const lastChildEntry = lastChild.entryPoint;
        this.extraSvgPath.push([
          lastChild.id,
          drawSmoothLine({
            sourceX: lastChildEntry.out.x,
            sourceY: lastChildEntry.out.y,
            targetX: this.entryPoint.out.x,
            targetY: maxY + 110,
            centerY: maxY + 50,
          }),
        ]);
      }
    });
  }

  override renderHorizontalEdge() {
    const flattenBranch = [...Object.entries(this.decisions)];

    const maxX = flattenBranch
      .map(([, it]) => it.filter((node) => node.needRender).at(-1))
      .reduce((previousValue, currentValue) => Math.max(previousValue, currentValue?.entryPoint.out.x ?? 0), 0);
    flattenBranch.forEach(([, branch]) => {
      const lastChild = branch.filter((node) => node.needRender).at(-1);
      if (lastChild) {
        const lastChildEntry = lastChild.entryPoint;
        this.extraSvgPath.push([
          lastChild.id,
          drawSmoothLine({
            sourceX: lastChildEntry.out.x,
            sourceY: lastChildEntry.out.y,
            targetX: maxX + 110,
            targetY: this.entryPoint.out.y,
            centerX: maxX + 50,
            sourcePosition: VinesSVGPosition.Right,
            targetPosition: VinesSVGPosition.Left,
          }),
        ]);
      }
    });
  }

  override renderController() {
    const flattenBranch = [...Object.entries(this.decisions)];

    const { branchIndexMap } = this.getDecisionChildren();

    const useHorizontal = this._vinesCore.renderDirection === 'horizontal';

    flattenBranch.forEach(([, it]) => {
      const entryPointIn = it?.[0]?.entryPoint.in;

      this.controller.push({
        disabled: flattenBranch.length <= 2,
        position: {
          x: entryPointIn.x - (useHorizontal ? 42 : 16),
          y: entryPointIn.y - (useHorizontal ? 16 : 42),
        },
        icon: '-',
        needConfirmation: '确定要删除该分支吗？本操作将无法撤销',
        onClick: () => {
          this.deleteDecision(branchIndexMap.get(it[0].id) ?? '');
          this._vinesCore.emit('update', this._vinesCore.getRaw());
        },
      });

      it.forEach((node) => node.renderController());
    });

    const entryPointOut = this.entryPoint.out;

    this.controller.push({
      position: {
        x: entryPointOut.x - (useHorizontal ? 18 : 16),
        y: entryPointOut.y - (useHorizontal ? 16 : 18),
      },
      icon: '+',
      onClick: () => VinesEvent.emit('flow-select-nodes', { _wid: this._vinesCore.workflowId, targetNodeId: this.id }),
    });
  }

  override get entryPoint() {
    const centerX = this.size.width / 2;

    const flattenBranch = [...Object.values(this.decisions)];
    const flattenBranchLastNodes = flattenBranch.map((it) => it.filter((node) => node.needRender).at(-1));

    if (this._vinesCore.renderDirection === 'vertical') {
      const maxY = flattenBranchLastNodes.reduce((previousValue, currentValue) => {
        return Math.max(previousValue, currentValue?.entryPoint.out.y ?? 0);
      }, 0);
      const inPoint = { x: this.position.x + centerX, y: this.position.y };
      const outPoint = { x: this.position.x + centerX, y: maxY + 80 };
      return {
        in: inPoint,
        out: outPoint,
      };
    } else {
      const maxX = flattenBranchLastNodes.reduce((previousValue, currentValue) => {
        return Math.max(previousValue, currentValue?.entryPoint.out.x ?? 0);
      }, 0);
      const inPoint = { x: this.position.x, y: this.position.y + 40 };
      const outPoint = { x: maxX + 80, y: this.position.y + 40 };
      return {
        in: inPoint,
        out: outPoint,
      };
    }
  }
  // endregion

  // region CURD

  override insertChild(params: IVinesInsertChildParams): VinesNode | VinesNode[] | null {
    const insertedNode = super.insertChild(params);
    if (insertedNode) {
      const { targetId, insertBefore } = params;
      const branchName = this.findDecisionBranch(targetId);
      if (branchName) {
        const branch = this.decisions[branchName];
        const insertIndex = branch.findIndex((child) => child.id === targetId);
        const isFakeNode = +/fake_node/.test(targetId);
        const insertedNodes = Array.isArray(insertedNode) ? insertedNode : [insertedNode];
        if (insertBefore) {
          branch.splice(insertIndex, isFakeNode, ...insertedNodes);
        } else {
          branch.splice(insertIndex + 1 - isFakeNode, isFakeNode, ...insertedNodes);
        }
        this.children = Object.values(this.decisions).flat();
      }
      return insertedNode;
    }
    return null;
  }

  override deleteChild(targetId: string, path: VinesNode[] = []) {
    if (super.deleteChild(targetId, path)) {
      const branchName = this.findDecisionBranch(targetId);
      if (branchName) {
        const branch = this.decisions[branchName];
        const deleteIndex = branch.findIndex((child) => child.id === targetId);
        branch.splice(deleteIndex, 1);

        if (!branch.length) {
          const newFakeNode = VinesNode.createFakeNode(this._vinesCore);
          branch.splice(deleteIndex, 0, newFakeNode);
          this.children = Object.values(this.decisions).flat();
        }
      }
      return true;
    }
    return false;
  }

  override getRaw() {
    (this._task as SwitchTaskDef).decisionCases = Object.fromEntries(
      Object.entries(this.decisions).map(([branchName, branchTasks]) => [
        branchName,
        branchTasks.map((it) => it.getRaw()),
      ]),
    );
    return this._task;
  }

  override updateRaw(nodeId: string, task: SwitchTaskDef): boolean {
    if (this.id === nodeId) {
      this._task = task;
      this.parseChildren((task as SwitchTaskDef).decisionCases);
      return true;
    }
    for (const branch of Object.values(this.decisions)) {
      for (const node of branch) {
        if (node.updateRaw(nodeId, task)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 插入新的分支
   * @param branchName
   * */
  public insertDecision(branchName: string) {
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(branchName) || Object.keys(this.decisions).length > this.maxDecision)
      return false;

    const newFakeNode = VinesNode.createFakeNode(this._vinesCore);
    this.decisions[branchName] = [newFakeNode];
    this.children = Object.values(this.decisions).flat();
    return true;
  }

  /**
   * 增量插入分支
   * */
  public insertDecisionUseIncrement() {
    const decisionCases = Object.keys(this.decisions);
    const decisionLength = decisionCases.length;
    let index = decisionLength + 1;
    if (index > this.maxDecision) return false;

    let branchName = `branch${index}`;
    while (decisionCases.includes(branchName)) {
      branchName = `branch${++index}`;
    }
    return this.insertDecision(branchName);
  }

  /**
   * 删除分支
   * */
  public deleteDecision(branchName: string) {
    if (Object.keys(this.decisions).length <= 2) return false;

    if (!this.decisions?.[branchName]?.length) return false;

    delete this.decisions[branchName];
    this.children = Object.values(this.decisions).flat();
    return true;
  }
  // endregion

  // region Tools
  /**
   * 查找节点所在的分支
   * @param id 节点 ID
   * */
  private findDecisionBranch(id: string): string | undefined {
    for (const branchName of Object.keys(this.decisions)) {
      if (this.decisions[branchName].some((it) => it.id === id)) {
        return branchName;
      }
    }
  }

  /**
   * 获取分支下的子节点列表
   * */
  private getDecisionChildren() {
    const decisions = Object.values(this.decisions);
    const branchCount = decisions.length;
    const isOdd = branchCount % 2 !== 0;

    const leftBranches = decisions.slice(0, branchCount / 2).reverse();
    const rightBranches = decisions.slice(branchCount / 2 + +isOdd, branchCount);
    const middleBranches = isOdd ? decisions.slice(branchCount / 2, branchCount / 2 + 1) : [];

    const branchIndexMap: Map<string, string> = new Map();
    Object.entries(this.decisions).forEach(([branchName, branch]) => branchIndexMap.set(branch[0].id, branchName));

    if (this._vinesCore.renderDirection === 'vertical') {
      return {
        leftBranches,
        rightBranches,
        middleBranches,
        branchIndexMap,
      };
    } else {
      return {
        leftBranches: rightBranches.reverse(),
        rightBranches: leftBranches.reverse(),
        middleBranches,
        branchIndexMap,
      };
    }
  }
  // endregion
}
