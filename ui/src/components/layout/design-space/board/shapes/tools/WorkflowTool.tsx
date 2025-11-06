import { createShapeId, StateNode, TLEventHandlers } from 'tldraw';

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
  setWorkflowData(data: {
    workflowId: string;
    workflowName: string;
    workflowDescription?: string;
    inputParams?: any[];
  }) {
    this.workflowData = data;
  }

  override onPointerDown: TLEventHandlers['onPointerDown'] = (info) => {
    const point = this.editor.inputs.currentPagePoint;

    // 创建一个新的 Workflow shape
    const id = createShapeId();

    // 根据参数数量和类型动态调整高度（与 shapePorts.ts 保持一致）
    const params = this.workflowData?.inputParams || [];
    
    // 基础高度计算
    const headerBarHeight = 40;           // 标题栏
    const contentPaddingTop = 12;         // 内容区域上padding
    const contentPaddingBottom = 12;      // 内容区域下padding
    const workflowNameHeight = 24;        // 工作流名称
    const workflowDescHeight = this.workflowData?.workflowDescription ? 20 : 0; // 工作流描述
    const workflowIdHeight = 20;          // ID 显示
    
    let baseHeight = headerBarHeight + contentPaddingTop + workflowNameHeight + 
                     workflowDescHeight + workflowIdHeight + contentPaddingBottom;
    
    // 计算参数区域高度
    if (params.length > 0) {
      const beforeParamsMargin = 12;        // marginTop
      const beforeParamsPadding = 12;       // paddingTop
      const paramsSectionTitleHeight = 20;  // "输入参数"标题
      const paramsTitleMarginBottom = 8;
      
      baseHeight += beforeParamsMargin + beforeParamsPadding + 
                    paramsSectionTitleHeight + paramsTitleMarginBottom;
      
      params.forEach((param: any) => {
        const labelHeight = 16;
        const labelMarginBottom = 4;
        const paramMarginBottom = 8;
        let inputHeight = 28;
        
        if (param.type === 'file') {
          inputHeight = 192;
        } else if (param.type === 'number' && param.typeOptions?.uiType === 'slider') {
          inputHeight = 40;
        }
        
        baseHeight += labelHeight + labelMarginBottom + inputHeight + paramMarginBottom;
      });
    }
    
    const totalHeight = Math.max(200, baseHeight);

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
