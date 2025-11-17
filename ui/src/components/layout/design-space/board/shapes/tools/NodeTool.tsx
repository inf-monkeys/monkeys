/**
 * NodeTool - Workflow 节点创建工具
 * 用于在画板上点击创建 Workflow 节点
 */
import { createShapeId, StateNode, TLEventHandlers } from 'tldraw';

import { getNodeDefinitions } from '../../workflow-examples/src/nodes/nodeTypes';

export class NodeTool extends StateNode {
  static override id = 'workflow-node';

  // 存储要创建的节点类型名称
  private nodeTypeName: string = 'add';

  override onEnter = () => {
    this.editor.setCursor({ type: 'cross', rotation: 0 });
  };

  override onExit = () => {
    this.editor.setCursor({ type: 'default', rotation: 0 });
  };

  // 设置节点类型（从工具栏调用）
  setNodeType(nodeTypeData: { type: string }) {
    this.nodeTypeName = nodeTypeData.type;
  }

  override onPointerDown: TLEventHandlers['onPointerDown'] = () => {
    const point = this.editor.inputs.currentPagePoint;

    // 获取节点定义并生成默认数据
    const nodeDefinitions = getNodeDefinitions(this.editor);
    const nodeDefinition = nodeDefinitions[this.nodeTypeName as keyof typeof nodeDefinitions];

    if (!nodeDefinition) {
      console.error(`未找到节点类型: ${this.nodeTypeName}`);
      return;
    }

    // 使用节点定义的 getDefault() 方法获取完整的节点数据
    const defaultNodeData = nodeDefinition.getDefault();

    // 创建一个新的 Node shape
    const id = createShapeId();

    this.editor.createShape({
      id,
      type: 'node',
      x: point.x,
      y: point.y,
      props: {
        node: defaultNodeData,
        isOutOfDate: false,
      },
    } as any);

    // 选中新创建的 shape
    this.editor.select(id);

    // 切回选择工具
    this.editor.setCurrentTool('select');
  };
}
