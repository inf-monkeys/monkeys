import { Injectable, Logger } from '@nestjs/common';

/**
 * Canvas Context Service
 *
 * **职责**：
 * - 准备canvas上下文信息用于发送给AI模型
 * - 包括画布状态、形状列表、视口信息等
 * - 支持集成与第三方tldraw实例（通过API或WebSocket）
 *
 * 注意：当前实现为基础版本，实际的画布数据由前端通过上下文发送
 */
@Injectable()
export class CanvasContextService {
  private readonly logger = new Logger(CanvasContextService.name);

  /**
   * 构建canvas上下文消息
   * 这些消息将被添加到AI模型的prompt中
   */
  async buildCanvasContext(opts: {
    threadId: string;
    teamId: string;
    userId: string;
    canvasData?: any;
    selectedShapeIds?: string[];
    viewport?: { x: number; y: number; zoom: number };
  }): Promise<string> {
    const { threadId, canvasData, selectedShapeIds, viewport } = opts;

    const contextParts: string[] = [];

    // Canvas状态摘要
    if (canvasData) {
      contextParts.push(this.formatCanvasData(canvasData));
    }

    // 选中的形状信息
    if (selectedShapeIds && selectedShapeIds.length > 0) {
      contextParts.push(`Currently selected shapes: ${selectedShapeIds.join(', ')}`);
    }

    // 视口信息
    if (viewport) {
      contextParts.push(
        `Viewport: position (${Math.round(viewport.x)}, ${Math.round(viewport.y)}), zoom: ${viewport.zoom.toFixed(2)}x`,
      );
    }

    if (contextParts.length === 0) {
      return `Canvas context for thread ${threadId}: No canvas data available yet.`;
    }

    return `Canvas Context:\n${contextParts.map((p) => `- ${p}`).join('\n')}`;
  }

  /**
   * 格式化canvas数据为模型易理解的形式
   */
  private formatCanvasData(canvasData: any): string {
    const shapes = canvasData.shapes || [];
    const shapeCount = shapes.length;

    if (shapeCount === 0) {
      return 'Canvas is empty - no shapes present';
    }

    // 统计形状类型
    const typeCount: Record<string, number> = {};
    const shapeList: string[] = [];

    for (const shape of shapes.slice(0, 20)) {
      // 只列出前20个形状
      const type = shape.type || 'unknown';
      typeCount[type] = (typeCount[type] || 0) + 1;

      // 构建形状信息
      let shapeInfo = `${shape.id || 'unnamed'} (${type})`;
      if (shape.props?.text) {
        shapeInfo += ` with text: "${shape.props.text.substring(0, 30)}"`;
      }
      shapeList.push(shapeInfo);
    }

    const typeSummary = Object.entries(typeCount)
      .map(([type, count]) => `${count} ${type}`)
      .join(', ');

    const summary = `Canvas contains ${shapeCount} shapes total (${typeSummary})`;
    const details =
      shapeCount > 0 ? `\nShapes: ${shapeList.join(' | ')}${shapeCount > 20 ? ` ... and ${shapeCount - 20} more` : ''}` : '';

    return summary + details;
  }

  /**
   * 为系统消息中添加canvas上下文提示
   */
  getCanvasContextSystemPromptAddition(): string {
    return `
---
Canvas Context Information:
You are working with a tldraw whiteboard. The canvas contains shapes, text, arrows, and diagrams.
When users ask questions about the canvas, the current state is provided in the conversation context.
The canvas may be updated during the conversation - pay attention to new context information.
You can see what's on the canvas but cannot directly manipulate it - that's handled by the user or the whiteboard interface.
`;
  }
}
