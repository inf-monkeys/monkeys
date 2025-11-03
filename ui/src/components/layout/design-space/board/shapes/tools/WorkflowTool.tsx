import { StateNode, TLEventHandlers, createShapeId } from 'tldraw';

export class WorkflowTool extends StateNode {
  static override id = 'workflow';

  // 存储工作流信息，用于创建shape时使用
  private workflowData: {
    workflowId: string;
    workflowName: string;
    workflowDescription?: string;
    inputParams?: any[];
  } | null = null;

  override onEnter = () => {
    this.editor.setCursor({ type: 'cross', rotation: 0 });
  };

  override onExit = () => {
    this.editor.setCursor({ type: 'default', rotation: 0 });
    this.workflowData = null;
  };

  // 设置工作流数据（从工具栏调用）
  setWorkflowData(data: { workflowId: string; workflowName: string; workflowDescription?: string; inputParams?: any[] }) {
    this.workflowData = data;
  }

  override onPointerDown: TLEventHandlers['onPointerDown'] = (info) => {
    const point = this.editor.inputs.currentPagePoint;
    
    // 创建一个新的 Workflow shape
    const id = createShapeId();
    
    // 根据参数数量动态调整高度
    const paramCount = this.workflowData?.inputParams?.length || 0;
    const baseHeight = 200;
    const paramHeight = paramCount > 0 ? 50 + paramCount * 50 : 0;
    const totalHeight = Math.max(baseHeight, baseHeight + paramHeight);
    
    this.editor.createShape({
      id,
      type: 'workflow',
      x: point.x,
      y: point.y,
      props: {
        w: 300,
        h: totalHeight,
        workflowId: this.workflowData?.workflowId || '',
        workflowName: this.workflowData?.workflowName || '未命名工作流',
        workflowDescription: this.workflowData?.workflowDescription || '',
        color: 'violet',
        isRunning: false,
        connections: [],
        inputParams: this.workflowData?.inputParams || [],
        inputConnections: [],
      },
    } as any);

    // 选中新创建的 shape
    this.editor.select(id);
    
    // 切回选择工具
    this.editor.setCurrentTool('select');
  };
}

