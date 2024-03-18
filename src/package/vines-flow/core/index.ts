import { MonkeyTaskDefTypes } from '@inf-monkeys/vines';
import { toast } from 'sonner';

import { VinesBase } from '@/package/vines-flow/core/base';
import { VINES_DEF_NODE, VINES_ENV_VARIABLES } from '@/package/vines-flow/core/consts.ts';
import { EndPointNode, VinesNode } from '@/package/vines-flow/core/nodes';
import {
  IVinesNodePosition,
  IVinesWorkflowUpdate,
  VinesEdgePath,
  VinesTask,
} from '@/package/vines-flow/core/nodes/typings.ts';
import { VinesTools } from '@/package/vines-flow/core/tools';
import {
  IVinesVariable,
  VinesToolDef,
  VinesVariableMapper,
  VinesWorkflowVariable,
} from '@/package/vines-flow/core/tools/typings.ts';
import { IVinesFlowRenderOptions, IVinesFlowRenderType, IVinesMode } from '@/package/vines-flow/core/typings.ts';
import { createTask } from '@/package/vines-flow/core/utils.ts';
import VinesEvent from '@/utils/events';

export class VinesCore extends VinesTools(VinesBase) {
  public workflowId: string | undefined;

  public workflowIcon = 'emoji:🍀:#ceefc5';

  public workflowName = '未命名应用';

  public workflowDesc = '';

  public version = 0;

  public nodes: VinesNode[] = [];

  public tasks: MonkeyTaskDefTypes[] = [];

  public workflowInput: VinesWorkflowVariable[] = [];

  public variables: IVinesVariable[] = [];

  public variablesMapper: VinesVariableMapper = new Map();

  public mode: IVinesMode = IVinesMode.EDIT;

  public renderOptions: IVinesFlowRenderOptions = {
    direction: 'vertical',
    type: IVinesFlowRenderType.SIMPLIFY,
  };

  public canvasSize = { width: 0, height: 0 };

  private position: IVinesNodePosition = { x: 0, y: 0 };

  private nodeInitSize = { width: 80, height: 80 };

  private init() {
    this.nodes = this.tasks.map((it) => VinesNode.create(it, this));
    this.nodes.splice(0, 0, EndPointNode.createStart(this));
    this.nodes.push(EndPointNode.createEnd(this));

    this.getAllNodes(false).map((it) => it.check());
    this.generateWorkflowVariables();

    if (this.nodeInitSize.width !== 80 || this.nodeInitSize.height !== 80) {
      this.setAllNodeSize(this.nodeInitSize.width, this.nodeInitSize.height);
    }
  }

  public update(
    { workflow, workflowId, version, tasks, variable, variables, renderType, renderDirection }: IVinesWorkflowUpdate,
    render = true,
  ) {
    let needToInit = false;
    if (workflow) {
      workflow?.workflowDef?.tasks &&
        (this.tasks = workflow.workflowDef.tasks.filter((task) => task)) &&
        (needToInit = true);
      workflow?.workflowId && (this.workflowId = workflow.workflowId);
      workflow?.version && (this.version = workflow.version);
      workflow?.variables && (this.workflowInput = workflow.variables);
      workflow?.name && (this.workflowName = workflow.name);
      workflow?.description && (this.workflowDesc = workflow.description);
      workflow?.iconUrl && (this.workflowIcon = workflow.iconUrl);
    }
    workflowId && (this.workflowId = workflowId);
    version && (this.version = version);
    tasks && (this.tasks = tasks.filter((task) => task)) && (needToInit = true);
    if (variables || variable) {
      variables && (this.workflowInput = variables);
      if (variable) {
        const index = this.workflowInput.findIndex((it) => it.name === variable.name);
        if (index !== -1) {
          this.workflowInput[index] = variable;
        } else {
          this.workflowInput.push(variable);
        }
      }
      this.generateWorkflowVariables();
      this.sendEvent('update');
    }

    needToInit && this.init();

    renderDirection && (this.renderOptions.direction = renderDirection);
    if (renderType) {
      this.renderOptions.type = renderType;
      const { width, height } = VINES_DEF_NODE[renderType];
      this.setAllNodeSize(width, height);
      this.nodeInitSize = { width, height };
    }

    render && this.render();
    this.sendEvent('refresh');
  }

  public setAllNodeSize(width: number, height: number) {
    this.getAllNodes().forEach((it) => (it.size = { width, height }));
  }

  // region Render
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

  svg(): [string, VinesEdgePath][] {
    const allNodes = this.getAllNodes().slice(0, -1);
    const result: [string, VinesEdgePath][][] = [];
    for (const node of allNodes) {
      const svg = node.svgPath();
      result.push(svg);
    }

    return result.flat();
  }

  // endregion

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

  // region CURD
  /**
   * 通过 ID 获取 VinesNode
   * @param id 节点 ID
   * */
  public getNodeById(id?: string): VinesNode | undefined {
    if (!id) {
      return void null;
    }

    for (const node of this.nodes) {
      const result = node.findChildById(id);
      if (result) return result;
    }

    return void null;
  }

  public createNode(
    toolOrName: VinesToolDef | string,
    extendObject: Record<string, string> = {},
  ): VinesNode | VinesNode[] {
    const tool = typeof toolOrName === 'string' ? this.getTool(toolOrName) : toolOrName;
    if (!tool) {
      toast.error(`未找到工具 ${toolOrName}`);
      return [];
    }
    return VinesNode.create(createTask(tool, extendObject), this).afterCreate();
  }

  /**
   * 警告：在 insertAfter 内调用此方法会导致死循环，请将 callAfter 设置为 false
   * */
  public insertNode(targetId: string, node: VinesNode | VinesNode[], insertBefore = false, callAfter = true): boolean {
    const index = this.nodes.findIndex((childNode) => childNode.id === targetId);
    const targetNode = this.getNodeById(targetId);
    if (index !== -1) {
      const isFakeNode = +/fake_node/.test(targetId);
      const insertIndex = insertBefore ? index : index + 1 - isFakeNode;
      this.nodes.splice(insertIndex, isFakeNode, ...(Array.isArray(node) ? node : [node]));

      callAfter && targetNode && targetNode.insertAfter();

      this.sendUpdateEvent();
      return true;
    }
    for (const childNode of this.nodes) {
      if (
        childNode.insertChild({
          targetId,
          node,
          path: [childNode],
          insertBefore,
        })
      ) {
        callAfter && targetNode && targetNode.insertAfter();

        this.sendUpdateEvent();
        return true;
      }
    }
    return false;
  }

  /**
   * 警告：在 deleteAfter 内调用此方法会导致死循环，请将 callAfter 设置为 false
   * */
  public deleteNode(targetId: string, callAfter = true) {
    const index = this.nodes.findIndex((childNode) => childNode.id === targetId);
    if (index !== -1) {
      this.nodes[index].destroy();
      this.nodes.splice(index, 1);
      void (this.nodes.length === 2 && this.nodes.splice(1, 0, VinesNode.createFakeNode(this)));

      callAfter && this.getNodeById(targetId)?.deleteAfter();

      this.sendUpdateEvent();
      return true;
    }
    for (const childNode of this.nodes) {
      if (childNode.deleteChild(targetId, [childNode])) {
        callAfter && this.getNodeById(targetId)?.deleteAfter();

        this.sendUpdateEvent();
        return true;
      }
    }
    return false;
  }

  /**
   * 移动节点
   * @param sourceId 源节点 ID
   * @param targetId 目标节点 ID
   * @param insertBefore 是否插入到目标节点之前
   * @param callAfter 是否触发节点的 moveAfter 方法
   * 警告：在 moveAfter 内调用此方法会导致死循环，请将 callAfter 设置为 false
   * */
  public move(sourceId: string, targetId: string, insertBefore: boolean, callAfter = true) {
    if (!this.canMove(sourceId, targetId)) {
      toast.error('无法移动节点到目标节点内部！');
      return;
    }

    const sourceIndex = this.nodes.findIndex((childNode) => childNode.id === sourceId);
    const targetIndex = this.nodes.findIndex((childNode) => childNode.id === targetId);
    if (sourceIndex !== -1 && targetIndex !== -1) {
      const [sourceNode] = this.nodes.splice(sourceIndex, 1);
      const shift = sourceIndex <= targetIndex ? -1 : 0;
      const insertIndex = insertBefore ? targetIndex + shift : targetIndex + shift + 1;
      this.nodes.splice(insertIndex, 0, sourceNode);

      callAfter && this.getNodeById(targetId)?.moveAfter('target');
      callAfter && this.getNodeById(sourceId)?.moveAfter('source');

      this.sendUpdateEvent();
    } else if (sourceIndex !== -1 && targetIndex === -1) {
      const [sourceNode] = this.nodes.splice(sourceIndex, 1);
      this.insertNode(targetId, sourceNode, insertBefore, callAfter);

      callAfter && this.getNodeById(targetId)?.moveAfter('target');
      callAfter && this.getNodeById(sourceId)?.moveAfter('source');
    } else {
      const sourceNode = this.getNodeById(sourceId);
      const targetNode = this.getNodeById(targetId);
      if (sourceNode && targetNode) {
        this.deleteNode(sourceId);
        this.insertNode(targetId, sourceNode, insertBefore, callAfter);
      }

      callAfter && targetNode?.moveAfter('target');
      callAfter && sourceNode?.moveAfter('source');

      this.sendUpdateEvent();
    }
  }

  private canMove(sourceId: string, targetId: string): boolean {
    const sourceNode = this.getNodeById(sourceId);
    return !!sourceNode && !sourceNode.findChildById(targetId);
  }

  /**
   * 更新节点 Task
   * @param nodeId 节点 ID
   * @param task Task
   * @param update 是否触发更新事件
   * */
  public updateRaw(nodeId: string, task: VinesTask, update = true) {
    for (const node of this.nodes) {
      if (node.updateRaw(nodeId, task)) {
        this.tasks = this.getRaw();
        if (update) {
          this.sendUpdateEvent();
        } else {
          this.emit('refresh');
        }
        return this.tasks;
      }
    }
  }

  public getRaw() {
    return this.nodes.slice(1, this.nodes.length - 1).map((it) => it.getRaw());
  }
  // endregion

  // region Tools
  get renderDirection() {
    return this.renderOptions.direction;
  }

  private sendUpdateEvent() {
    this.sendEvent('update', this.getRaw());
  }
  // endregion

  // region Variables
  public generateWorkflowVariables(): { variables: IVinesVariable[]; mapper: VinesVariableMapper } {
    const nodes = this.getAllNodes().filter((it) => !(it instanceof EndPointNode) && !it.isFake);
    const nodesVariables: IVinesVariable[] = [];
    let nodesVariablesMapper: VinesVariableMapper = new Map();

    for (const node of nodes) {
      const { variables, mapper } = node.variable();
      nodesVariables.push(...variables);
      nodesVariablesMapper = new Map([...nodesVariablesMapper, ...mapper]);
    }

    const workflowInputVariable = this.generateVariable(
      {
        id: 'workflow',
        name: this.workflowName,
        desc: this.workflowDesc,
        icon: this.workflowIcon,
      },
      'workflow',
      this.workflowInput,
      '${{target}.input.{variable}}',
      '$.{target}.input.{variable}',
    );
    const workflowInputVariableMapper = this.generateVariableMapper(workflowInputVariable, '工作流输入');

    const workflowEnvVariable = this.generateVariable(
      {
        id: 'workflowInput',
        name: this.workflowName + '的环境变量',
        desc: this.workflowDesc,
        icon: this.workflowIcon,
      },
      'workflow.input',
      VINES_ENV_VARIABLES,
      '${{target}.{variable}}',
      '$.{target}.{variable}',
    );
    const workflowEnvVariableMapper = this.generateVariableMapper(workflowEnvVariable, '环境变量');

    this.variables = [...workflowInputVariable, ...workflowEnvVariable, ...nodesVariables];
    this.variablesMapper = new Map([
      ...workflowInputVariableMapper,
      ...workflowEnvVariableMapper,
      ...nodesVariablesMapper,
    ]);

    return {
      variables: this.variables,
      mapper: this.variablesMapper,
    };
  }
  // endregion
}
