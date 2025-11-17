import { Editor } from 'tldraw';

import { InstructionShape, OutputShape } from '../instruction/InstructionShape.types';

/**
 * 连接管理器
 * 负责管理 Instruction 和 Output 之间的连接关系
 */
export class ConnectionManager {
  private editor: Editor;

  constructor(editor: Editor) {
    this.editor = editor;
  }

  /**
   * 创建从 Instruction 到 Output 的连接
   */
  createConnection(instructionId: string, outputId: string): void {
    const instructionShape = this.editor.getShape(instructionId as any) as InstructionShape;
    const outputShape = this.editor.getShape(outputId as any) as OutputShape;

    if (!instructionShape || !outputShape) {
      console.error('[ConnectionManager] Shape not found', { instructionId, outputId });
      return;
    }

    // 更新 Instruction 的连接列表
    const connections = instructionShape.props.connections || [];
    if (!connections.includes(outputId)) {
      console.log('[ConnectionManager] 添加连接', {
        from: instructionId,
        to: outputId,
        currentConnections: connections,
      });

      this.editor.updateShape<InstructionShape>({
        id: instructionShape.id,
        type: 'instruction',
        props: {
          ...instructionShape.props,
          connections: [...connections, outputId],
        },
      });
    }
    // 连接已存在是正常情况，不需要打印日志

    // 更新 Output 的来源
    if (outputShape.props.sourceId !== instructionId) {
      console.log('[ConnectionManager] 更新 Output 的来源', {
        outputId,
        oldSource: outputShape.props.sourceId,
        newSource: instructionId,
      });

      this.editor.updateShape<OutputShape>({
        id: outputShape.id,
        type: 'output',
        props: {
          ...outputShape.props,
          sourceId: instructionId,
        },
      });
    }
  }

  /**
   * 移除连接
   */
  removeConnection(instructionId: string, outputId: string): void {
    const instructionShape = this.editor.getShape(instructionId as any) as InstructionShape;
    const outputShape = this.editor.getShape(outputId as any) as OutputShape;

    if (instructionShape) {
      const connections = instructionShape.props.connections || [];
      this.editor.updateShape<InstructionShape>({
        id: instructionShape.id,
        type: 'instruction',
        props: {
          ...instructionShape.props,
          connections: connections.filter((id) => id !== outputId),
        },
      });
    }

    if (outputShape) {
      this.editor.updateShape<OutputShape>({
        id: outputShape.id,
        type: 'output',
        props: {
          ...outputShape.props,
          sourceId: '',
        },
      });
    }
  }

  /**
   * 获取 Instruction 的所有连接的 Output
   */
  getConnectedOutputs(instructionId: string): OutputShape[] {
    const instructionShape = this.editor.getShape(instructionId as any) as InstructionShape;
    if (!instructionShape) return [];

    const connections = instructionShape.props.connections || [];
    return connections
      .map((id) => this.editor.getShape(id as any))
      .filter((shape): shape is OutputShape => shape?.type === 'output');
  }

  /**
   * 获取 Output 的来源 Instruction
   */
  getSourceInstruction(outputId: string): InstructionShape | null {
    const outputShape = this.editor.getShape(outputId as any) as OutputShape;
    if (!outputShape || !outputShape.props.sourceId || outputShape.props.sourceId === '') return null;

    const sourceShape = this.editor.getShape(outputShape.props.sourceId as any);
    return sourceShape?.type === 'instruction' ? (sourceShape as InstructionShape) : null;
  }
}
