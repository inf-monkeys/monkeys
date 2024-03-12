import { type ForkJoinTaskDef, TaskType } from '@io-orkes/conductor-javascript';

import { VinesCore } from '@/package/vines-flow/core';
import { JoinNode, VinesJoinTaskDef } from '@/package/vines-flow/core/nodes';
import { ControlFlowVinesNode, VinesNode } from '@/package/vines-flow/core/nodes/base.ts';
import { drawSmoothLine, VinesSVGPosition } from '@/package/vines-flow/core/nodes/svg-utils.ts';
import { IVinesMoveAfterTargetType, IVinesNodePosition } from '@/package/vines-flow/core/nodes/typings.ts';
import { getBoundary } from '@/package/vines-flow/core/utils.ts';
import VinesEvent from '@/utils/events.ts';

export type VinesForkJoinTaskDef = ForkJoinTaskDef & { __joinTaskId?: string };

export class ForkJoinNode extends ControlFlowVinesNode<VinesForkJoinTaskDef> {
  static {
    VinesNode.register(TaskType.FORK_JOIN, ForkJoinNode);
  }

  public joinTaskId: string | null = null;

  public branches: VinesNode[][] = [];

  public readonly maxBranches = 5;

  private joinOnBranchIndex: number[] = [];

  constructor(task: VinesForkJoinTaskDef, vinesCore: VinesCore) {
    super(task, vinesCore);

    this.parseChildren(task?.forkTasks ?? []);
    this.joinTaskId = task.__joinTaskId ?? null;

    const taskJoinOn = (task.inputParameters?.joinOn as (number | string)[] | undefined) ?? [];
    if (Array.isArray(taskJoinOn)) {
      const hasAll = taskJoinOn.includes('all');
      void (!hasAll && (this.joinOnBranchIndex = taskJoinOn.map((it) => Number(it)).filter((it) => !isNaN(it))));
    }
  }

  private parseChildren(forkTasks: VinesForkJoinTaskDef['forkTasks']) {
    this.branches = forkTasks.map((branch) => branch.map((node) => VinesNode.create(node, this._vinesCore)));
    this.children = this.branches.flat();
    if (!this.joinOnBranchIndex.length) {
      this.joinOnBranchIndex = Array.from({ length: this.branches.length }, (_, i) => i);
    } else {
      this.joinOnBranchIndex = this.joinOnBranchIndex.filter((it) => it < this.branches.length);
    }
  }

  override check() {
    // 没有分支时创建一条分支
    void (!this.branches.length && this.branches.push([VinesNode.createFakeNode(this._vinesCore)]));

    // 为空分支插入一个假节点
    this.branches.forEach((branch) => !branch.length && branch.push(VinesNode.createFakeNode(this._vinesCore)));

    // 检查关联的 Join 节点
    let newJoinNode: JoinNode | undefined = void 0;
    if (this.joinTaskId) {
      const relevanceJoinNode = this._vinesCore.getNodeById(this.joinTaskId ?? '') as JoinNode | undefined;
      void (!relevanceJoinNode && (newJoinNode = this.createRelevanceJoinNode(this)));
      void (relevanceJoinNode && relevanceJoinNode.forkTaskId !== this.id && relevanceJoinNode.forkTaskId === this.id);
    } else {
      newJoinNode = this.createRelevanceJoinNode(this);
    }

    if (newJoinNode) {
      this._vinesCore.insertNode(this.id, newJoinNode);
    }

    this.updateRelevanceJoinNode();

    return super.check();
  }

  // region Render | 此处与 Switch 逻辑基本相同
  override render(position: IVinesNodePosition, path: VinesNode[] = []) {
    if (position.x === -999999 || position.y === -999999) return;

    this.position.x = position.x;
    this.position.y = position.y;

    if (this._vinesCore.renderDirection === 'horizontal') return this.renderHorizontal(position, path);

    const nodeWidth = this.size.width;
    position.y += this.size.height + 102;

    const branchLength = this.branches.length;

    this.controller = [
      {
        disabled: branchLength + 1 > this.maxBranches,
        position: {
          x: this.entryPoint.out.x - 16,
          y: this.position.y + this.size.height + 8,
        },
        icon: '+',
        needConfirmation: '确定要新建分支吗？',
        onClick: () => {
          this.insertBranch();
          this._vinesCore.emit('update', this._vinesCore.getRaw());
        },
      },
    ];

    const { leftBranches, rightBranches, middleBranches } = this.getDecisionChildren();

    const offset =
      nodeWidth + (this.size.width !== 80 ? (branchLength === 2 ? 0 : 80) : 110 + (branchLength === 2 ? 0 : 190));

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

  override async renderHorizontal(position: IVinesNodePosition, path: VinesNode[] = []) {
    const nodeHeight = this.size.height;

    position.x += this.size.width + 102;

    const branchLength = this.branches.length;

    this.controller = [
      {
        disabled: branchLength + 1 > this.maxBranches,
        position: {
          x: this.entryPoint.in.x + this.size.width + 8,
          y: this.position.y + this.size.height / 2 - 16,
        },
        icon: '+',
        needConfirmation: '确定要新建分支吗？',
        onClick: () => {
          this.insertBranch();
          this._vinesCore.emit('update', this._vinesCore.getRaw());
        },
      },
    ];

    const { leftBranches: topBranches, rightBranches: bottomBranches, middleBranches } = this.getDecisionChildren();

    const offset =
      nodeHeight + (this.size.width !== 80 ? (branchLength === 2 ? 0 : 80) : 110 + (branchLength === 2 ? 0 : 190));

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
    const flattenBranch = this.branches;
    flattenBranch.forEach((it, index) => {
      this.extraSvgPath.push([`${this.id}_branch${index}`, this.renderHead(it, 50)]);
      it.forEach((node, nodeIndex) => node.renderEdge(nodeIndex === it.length - 1));
    });

    if (this._vinesCore.renderDirection === 'horizontal') return this.renderHorizontalEdge();

    const maxY = flattenBranch
      .map((it) => it.filter((node) => node.needRender).at(-1))
      .reduce((previousValue, currentValue) => Math.max(previousValue, currentValue?.entryPoint.out.y ?? 0), 0);
    flattenBranch.forEach((it) => {
      const lastChild = it.filter((node) => node.needRender).at(-1);
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
    const flattenBranch = this.branches;

    const maxX = flattenBranch
      .map((it) => it.filter((node) => node.needRender).at(-1))
      .reduce((previousValue, currentValue) => Math.max(previousValue, currentValue?.entryPoint.out.x ?? 0), 0);
    flattenBranch.forEach((it) => {
      const lastChild = it.filter((node) => node.needRender).at(-1);

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
    const flattenBranch = this.branches;

    const { branchIndexMap } = this.getDecisionChildren();

    const useHorizontal = this._vinesCore.renderDirection === 'horizontal';

    flattenBranch.forEach((it) => {
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
          this.deleteBranch(branchIndexMap.indexOf(it[0].id));
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
      onClick: () =>
        VinesEvent.emit('flow-select-nodes', {
          selectMode: true,
          targetNodeId: this.id,
        }),
    });
  }

  override get entryPoint() {
    const centerX = this.size.width / 2;

    if (this._vinesCore.renderDirection === 'vertical') {
      const maxY = this.branches
        .map((it) => it.filter((node) => node.needRender).at(-1))
        .reduce((previousValue, currentValue) => {
          return Math.max(previousValue, currentValue?.entryPoint.out.y ?? 0);
        }, 0);
      const inPoint = { x: this.position.x + centerX, y: this.position.y };
      const outPoint = { x: this.position.x + centerX, y: maxY + 80 };
      return {
        in: inPoint,
        out: outPoint,
      };
    } else {
      const maxX = this.branches
        .map((it) => it.filter((node) => node.needRender).at(-1))
        .reduce((previousValue, currentValue) => {
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

  private getDecisionChildren() {
    const decisions = this.branches;
    const branchCount = decisions.length;
    const isOdd = branchCount % 2 !== 0;

    const leftBranches = decisions.slice(0, branchCount / 2).reverse();
    const rightBranches = decisions.slice(branchCount / 2 + +isOdd, branchCount);
    const middleBranches = isOdd ? decisions.slice(branchCount / 2, branchCount / 2 + 1) : [];

    // 以每个节点的第一个节点 ID 顺序建立索引表
    const branchIndexMap = [
      ...leftBranches.map((it) => it[0].id).reverse(),
      ...middleBranches.map((it) => it[0].id),
      ...rightBranches.map((it) => it[0].id),
    ];

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

  // region CURD
  override afterCreate(): VinesNode | VinesNode[] {
    const node = super.afterCreate() as ForkJoinNode;
    const joinNode = this.createRelevanceJoinNode(node);

    return [node, joinNode];
  }

  override insertAfter() {
    void (this.joinTaskId && this._vinesCore.move(this.joinTaskId, this.id, false, false));
    this.updateRelevanceJoinNode();

    return super.insertAfter();
  }

  override moveAfter(targetType: IVinesMoveAfterTargetType) {
    void (this.joinTaskId && this._vinesCore.move(this.joinTaskId, this.id, false, false));
    this.updateRelevanceJoinNode();

    return super.moveAfter(targetType);
  }

  /**
   * 插入分支
   * */
  public insertBranch() {
    if (this.branches.length + 1 > this.maxBranches) return false;

    const newBranch = [VinesNode.createFakeNode(this._vinesCore)];
    this.branches.push(newBranch);
    this.children = this.branches.flat();

    return true;
  }

  /**
   * 根据索引删除分支
   * @param index 分支索引
   * */
  public deleteBranch(index: number) {
    if (this.branches.length - 1 < 2) return false;

    this.branches.splice(index, 1);
    this.children = this.branches.flat();

    return true;
  }

  override getRaw() {
    (this._task as VinesForkJoinTaskDef).forkTasks = this.branches.map((branch) => branch.map((node) => node.getRaw()));

    return super.getRaw();
  }

  override updateRaw(nodeId: string, task: VinesForkJoinTaskDef) {
    if (this.id === nodeId) {
      this.parseChildren(task?.forkTasks ?? []);
      this.joinTaskId = task.__joinTaskId ?? null;

      const branches = this.branches.map((it) => it.at(-1)?.id ?? '').filter((it) => it);
      const joinOnBranches = task?.inputParameters?.joinOn as (string | number)[] | undefined;
      if (Array.isArray(joinOnBranches) && task.inputParameters) {
        const hasAll = joinOnBranches.includes('all');
        void (hasAll && ((task.inputParameters.joinOn as unknown as string[]) = ['all']));

        this.joinOnBranchIndex = joinOnBranches
          .map((it) => Number(it))
          .filter((it) => !isNaN(it) && it < branches.length);
      } else {
        this.joinOnBranchIndex = Array.from({ length: branches.length }, (_, i) => i);
      }

      this.updateRelevanceJoinNode();

      this._task = task;
      return true;
    }

    for (const branch of this.branches) {
      for (const node of branch) {
        if (node.updateRaw(nodeId, task)) {
          this.updateRelevanceJoinNode();

          return true;
        }
      }
    }
    return false;
  }
  // endregion

  // region Tools
  private updateRelevanceJoinNode() {
    const joinNode = this._vinesCore.getNodeById(this.joinTaskId ?? '') as JoinNode | undefined;
    if (joinNode) {
      joinNode.forkTaskId = this.id;
      joinNode.joinOn = this.joinOnBranchIndex.map((it) => this.branches[it].at(-1)?.id ?? '').filter((it) => it);
    }
  }

  private createRelevanceJoinNode(node: ForkJoinNode): JoinNode {
    const joinOn = node.branches.map((branch) => branch.at(-1)?.id ?? '').filter((it) => it);

    const joinNodeTaskId = 'notification_join_' + Math.random().toString(36).slice(-8);
    const joinNode: VinesJoinTaskDef = {
      name: 'notification_join',
      taskReferenceName: joinNodeTaskId,
      type: TaskType.JOIN,
      joinOn,
      __forkTaskId: node.id,
    };

    node.joinTaskId = joinNodeTaskId;
    node._task.__joinTaskId = joinNodeTaskId;

    return VinesNode.create(joinNode, this._vinesCore) as JoinNode;
  }
  // endregion

  override destroy() {
    this.branches.forEach((branch) => branch.forEach((node) => node.destroy()));
    void (this.joinTaskId && this._vinesCore.deleteNode(this.joinTaskId));
    return super.destroy();
  }
}
