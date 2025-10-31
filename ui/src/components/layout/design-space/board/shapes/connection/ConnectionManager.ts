import { Editor, TLArrowShape } from 'tldraw';
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
   * 监听箭头形状的变化，自动建立连接
   */
  watchArrowConnections(): void {
    console.log('[ConnectionManager] 开始监听箭头连接');
    
    const handleArrowChange = () => {
      try {
        const arrows = this.editor.getCurrentPageShapes().filter((shape) => shape.type === 'arrow') as TLArrowShape[];

        const isPointInRect = (p: { x: number; y: number }, r: { x: number; y: number; w: number; h: number }) => {
          return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
        };

        const expandRect = (r: { x: number; y: number; w: number; h: number }, padding = 24) => ({
          x: r.x - padding,
          y: r.y - padding,
          w: r.w + padding * 2,
          h: r.h + padding * 2,
        });

        arrows.forEach((arrow) => {
          const start = arrow.props.start as any;
          const end = arrow.props.end as any;

          // 优先使用绑定判定
          if (start?.type === 'binding' && end?.type === 'binding') {
            const startShape = this.editor.getShape(start.boundShapeId);
            const endShape = this.editor.getShape(end.boundShapeId);
            if (startShape?.type === 'instruction' && endShape?.type === 'output') {
              this.createConnection(startShape.id, endShape.id);
              return;
            }
          }

          // 宽松判定：若端点落在矩形区域内（带 padding），也认为已连接
          try {
            const startAbs = { x: arrow.x + (start?.x ?? 0), y: arrow.y + (start?.y ?? 0) };
            const endAbs = { x: arrow.x + (end?.x ?? 0), y: arrow.y + (end?.y ?? 0) };

            // 找到与端点最近的 instruction / output
            const shapes = this.editor.getCurrentPageShapes();
            const instructions = shapes.filter((s) => s.type === 'instruction');
            const outputs = shapes.filter((s) => s.type === 'output');

            const findHit = (candidates: any[], point: { x: number; y: number }) => {
              for (const s of candidates) {
                const b = this.editor.getShapePageBounds(s.id as any);
                if (!b) continue;
                if (isPointInRect(point, expandRect(b))) return s;
              }
              return null;
            };

            const startHit = findHit(instructions as any, startAbs);
            const endHit = findHit(outputs as any, endAbs);

            if (startHit && endHit) {
              this.createConnection(startHit.id, endHit.id);
            }
          } catch {}
        });
      } catch (error) {
        console.error('[ConnectionManager] 处理箭头变化时出错:', error);
      }
    };

    // 监听编辑器变化
    this.editor.on('change', handleArrowChange);
    
    // 初始检查一次现有的箭头
    handleArrowChange();
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

