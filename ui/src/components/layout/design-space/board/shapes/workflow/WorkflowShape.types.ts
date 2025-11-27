import { TLBaseShape, TLDefaultColorStyle } from 'tldraw';

export interface WorkflowInputParam {
  name: string;
  displayName?: string;
  type: string;
  value: any;
  required?: boolean;
  description?: string;
  typeOptions?: {
    options?: Array<{
      name?: string;
      value?: string;
      label?: string;
    }>;
    multipleValues?: boolean;
    [key: string]: any;
  };
}

export interface WorkflowInputConnection {
  paramName: string; // 参数名称
  instructionId: string; // 连接的Instruction ID
}

export type WorkflowShape = TLBaseShape<
  'workflow',
  {
    w: number;
    h: number;
    workflowId: string;
    workflowName: string;
    workflowDescription?: string;
    color: TLDefaultColorStyle;
    isRunning: boolean;
    connections: string[]; // 连接到的 output shape ids
    inputParams: WorkflowInputParam[]; // 输入参数列表
    inputConnections: WorkflowInputConnection[]; // 输入连接列表
    generatedTime: number; // 生成耗时（毫秒），0 表示未生成
  }
>;
