import { Injectable, Logger } from '@nestjs/common';
import { TldrawToolContext, TldrawToolsRegistryService } from './tldraw-tools-registry.service';

// 工具执行结果
export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
}

// 工具执行器接口
export interface TldrawToolExecutor {
  execute(action: any, context: TldrawToolContext): Promise<ToolExecutionResult>;
}

@Injectable()
export class TldrawToolExecutorService {
  private readonly logger = new Logger(TldrawToolExecutorService.name);
  private readonly executors = new Map<string, TldrawToolExecutor>();

  constructor(private readonly toolsRegistry: TldrawToolsRegistryService) {
    this.registerExecutors();
  }

  /**
   * 执行工具调用
   */
  async executeTool(action: any, context: TldrawToolContext): Promise<ToolExecutionResult> {
    const toolName = action._type;
    const executor = this.executors.get(toolName);

    if (!executor) {
      this.logger.warn(`No executor found for tool: ${toolName}`);
      return {
        success: false,
        error: `Unknown tool: ${toolName}`,
      };
    }

    try {
      // 验证工具schema
      const toolDef = this.toolsRegistry.getTool(toolName);
      if (toolDef) {
        const validationResult = toolDef.schema.safeParse(action);
        if (!validationResult.success) {
          this.logger.warn(`Invalid action schema for tool ${toolName}:`, validationResult.error);
          return {
            success: false,
            error: `Invalid action schema: ${validationResult.error.message}`,
          };
        }
      }

      // 检查是否需要editor
      if (toolDef?.requiresEditor && !context.editor) {
        return {
          success: false,
          error: `Tool ${toolName} requires tldraw editor instance`,
        };
      }

      const result = await executor.execute(action, context);
      this.logger.log(`Tool ${toolName} executed: ${result.success ? 'success' : 'failed'}`);
      return result;
    } catch (error) {
      this.logger.error(`Error executing tool ${toolName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 注册工具执行器
   */
  private registerExecutors(): void {
    // 形状操作执行器
    this.registerShapeExecutors();

    // 布局执行器
    this.registerLayoutExecutors();

    // 绘图执行器
    this.registerDrawingExecutors();

    // 外部API执行器
    this.registerExternalExecutors();

    // 规划执行器
    this.registerPlanningExecutors();
  }

  private registerShapeExecutors(): void {
    // 创建形状执行器
    this.executors.set('create', {
      execute: async (action, context) => {
        const { editor } = context;
        const { shape } = action;

        try {
          // 转换简单形状为tldraw形状
          const tldrawShape = this.convertSimpleShapeToTldrawShape(editor, shape);
          editor.createShape(tldrawShape);

          return {
            success: true,
            data: { shapeId: shape.shapeId },
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create shape',
          };
        }
      },
    });

    // 移动形状执行器
    this.executors.set('move', {
      execute: async (action, context) => {
        const { editor } = context;
        const { shapeId, x, y } = action;

        try {
          const shapeIdWithPrefix = `shape:${shapeId}`;
          const shape = editor.getShape(shapeIdWithPrefix);
          if (!shape) {
            return {
              success: false,
              error: `Shape ${shapeId} not found`,
            };
          }

          editor.updateShape({
            id: shapeIdWithPrefix,
            type: shape.type,
            x,
            y,
          });

          return {
            success: true,
            data: { shapeId, x, y },
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to move shape',
          };
        }
      },
    });

    // 删除形状执行器
    this.executors.set('delete', {
      execute: async (action, context) => {
        const { editor } = context;
        const { shapeId } = action;

        try {
          const shapeIdWithPrefix = `shape:${shapeId}`;
          editor.deleteShape(shapeIdWithPrefix);

          return {
            success: true,
            data: { shapeId },
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete shape',
          };
        }
      },
    });

    // 更新形状执行器
    this.executors.set('update', {
      execute: async (action, context) => {
        const { editor } = context;
        const { shapeId, props } = action;

        try {
          const shapeIdWithPrefix = `shape:${shapeId}`;
          const shape = editor.getShape(shapeIdWithPrefix);
          if (!shape) {
            return {
              success: false,
              error: `Shape ${shapeId} not found`,
            };
          }

          editor.updateShape({
            id: shapeIdWithPrefix,
            type: shape.type,
            ...props,
          });

          return {
            success: true,
            data: { shapeId, props },
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update shape',
          };
        }
      },
    });

    // 调整大小执行器
    this.executors.set('resize', {
      execute: async (action, context) => {
        const { editor } = context;
        const { shapeId, w, h, scaleX, scaleY } = action;

        try {
          const shapeIdWithPrefix = `shape:${shapeId}`;
          const shape = editor.getShape(shapeIdWithPrefix);
          if (!shape) {
            return {
              success: false,
              error: `Shape ${shapeId} not found`,
            };
          }

          const updateProps: any = {};
          if (w !== undefined) updateProps.w = w;
          if (h !== undefined) updateProps.h = h;
          if (scaleX !== undefined) updateProps.scaleX = scaleX;
          if (scaleY !== undefined) updateProps.scaleY = scaleY;

          editor.updateShape({
            id: shapeIdWithPrefix,
            type: shape.type,
            ...updateProps,
          });

          return {
            success: true,
            data: { shapeId, ...updateProps },
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to resize shape',
          };
        }
      },
    });

    // 旋转执行器
    this.executors.set('rotate', {
      execute: async (action, context) => {
        const { editor } = context;
        const { shapeId, angle } = action;

        try {
          const shapeIdWithPrefix = `shape:${shapeId}`;
          const shape = editor.getShape(shapeIdWithPrefix);
          if (!shape) {
            return {
              success: false,
              error: `Shape ${shapeId} not found`,
            };
          }

          editor.updateShape({
            id: shapeIdWithPrefix,
            type: shape.type,
            rotation: angle,
          });

          return {
            success: true,
            data: { shapeId, angle },
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to rotate shape',
          };
        }
      },
    });

    // 添加标签执行器
    this.executors.set('label', {
      execute: async (action, context) => {
        const { editor } = context;
        const { shapeId, label } = action;

        try {
          const shapeIdWithPrefix = `shape:${shapeId}`;
          const shape = editor.getShape(shapeIdWithPrefix);
          if (!shape) {
            return {
              success: false,
              error: `Shape ${shapeId} not found`,
            };
          }

          // 为形状添加标签（这里需要根据tldraw的具体实现来调整）
          editor.updateShape({
            id: shapeIdWithPrefix,
            type: shape.type,
            meta: {
              ...shape.meta,
              label,
            },
          });

          return {
            success: true,
            data: { shapeId, label },
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to label shape',
          };
        }
      },
    });
  }

  private registerLayoutExecutors(): void {
    // 对齐执行器
    this.executors.set('align', {
      execute: async (action, context) => {
        const { editor } = context;
        const { shapeIds, mode } = action;

        try {
          const shapeIdsWithPrefix = shapeIds.map((id: string) => `shape:${id}`);
          editor.alignShapes(shapeIdsWithPrefix, mode);

          return {
            success: true,
            data: { shapeIds, mode },
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to align shapes',
          };
        }
      },
    });

    // 分布执行器
    this.executors.set('distribute', {
      execute: async (action, context) => {
        const { editor } = context;
        const { shapeIds, mode } = action;

        try {
          const shapeIdsWithPrefix = shapeIds.map((id: string) => `shape:${id}`);
          editor.distributeShapes(shapeIdsWithPrefix, mode);

          return {
            success: true,
            data: { shapeIds, mode },
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to distribute shapes',
          };
        }
      },
    });

    // 清空画板执行器
    this.executors.set('clear', {
      execute: async (action, context) => {
        const { editor } = context;

        try {
          const allShapes = editor.getCurrentPageShapes();
          const shapeIds = allShapes.map((shape) => shape.id);
          editor.deleteShapes(shapeIds);

          return {
            success: true,
            data: { clearedCount: shapeIds.length },
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to clear canvas',
          };
        }
      },
    });
  }

  private registerDrawingExecutors(): void {
    // 手绘执行器
    this.executors.set('pen', {
      execute: async (action, context) => {
        const { editor } = context;
        const { points, color, size } = action;

        try {
          // 创建手绘形状
          const drawShape = {
            id: `shape:${Date.now()}`,
            type: 'draw',
            x: points[0]?.x || 0,
            y: points[0]?.y || 0,
            props: {
              points,
              color: color || 'black',
              size: size || 2,
            },
          };

          editor.createShape(drawShape);

          return {
            success: true,
            data: { shapeId: drawShape.id },
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to draw pen stroke',
          };
        }
      },
    });
  }

  private registerExternalExecutors(): void {
    // 维基百科执行器
    this.executors.set('getInspiration', {
      execute: async (action, context) => {
        try {
          const response = await fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary', {
            headers: { 'User-Agent': 'tldraw-agent-v2' },
          });

          if (!response.ok) {
            throw new Error(`Wikipedia API returned status ${response.status}`);
          }

          const data = await response.json();
          return {
            success: true,
            data: {
              title: data.title,
              extract: data.extract,
              url: data.content_urls.desktop.page,
            },
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch Wikipedia article',
          };
        }
      },
    });

    // 国家信息执行器
    this.executors.set('countryInfo', {
      execute: async (action, context) => {
        const { code } = action;

        try {
          const response = await fetch(`https://restcountries.com/v3.1/alpha/${code}`);

          if (!response.ok) {
            throw new Error(`Country API returned status ${response.status}`);
          }

          const data = await response.json();
          return {
            success: true,
            data: Array.isArray(data) ? data[0] : data,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch country info',
          };
        }
      },
    });

    // 统计形状执行器
    this.executors.set('countShapes', {
      execute: async (action, context) => {
        const { editor } = context;

        try {
          const allShapes = editor.getCurrentPageShapes();
          const shapeCounts = allShapes.reduce(
            (acc, shape) => {
              acc[shape.type] = (acc[shape.type] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          );

          return {
            success: true,
            data: {
              total: allShapes.length,
              byType: shapeCounts,
            },
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to count shapes',
          };
        }
      },
    });
  }

  private registerPlanningExecutors(): void {
    // 思考执行器（仅记录，不执行实际操作）
    this.executors.set('think', {
      execute: async (action, context) => {
        return {
          success: true,
          data: { text: action.text },
        };
      },
    });

    // 审查执行器
    this.executors.set('review', {
      execute: async (action, context) => {
        const { editor } = context;

        try {
          const allShapes = editor.getCurrentPageShapes();
          const review = {
            shapeCount: allShapes.length,
            shapeTypes: [...new Set(allShapes.map((s) => s.type))],
            bounds: editor.getViewportPageBounds(),
          };

          return {
            success: true,
            data: review,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to review canvas',
          };
        }
      },
    });

    // 设置视图执行器
    this.executors.set('setMyView', {
      execute: async (action, context) => {
        const { editor } = context;
        const { x, y, w, h } = action;

        try {
          editor.setCamera({
            x: -x,
            y: -y,
            z: 1,
          });

          if (w && h) {
            editor.setViewportPageBounds({
              x,
              y,
              w,
              h,
            });
          }

          return {
            success: true,
            data: { x, y, w, h },
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to set view',
          };
        }
      },
    });

    // 消息执行器（仅记录，不执行实际操作）
    this.executors.set('message', {
      execute: async (action, context) => {
        return {
          success: true,
          data: { message: action.message },
        };
      },
    });
  }

  /**
   * 转换简单形状为tldraw形状
   */
  private convertSimpleShapeToTldrawShape(editor: any, simpleShape: any): any {
    // 这里需要根据tldraw的具体实现来转换形状
    // 这是一个简化的实现，实际需要更复杂的转换逻辑
    return {
      id: `shape:${simpleShape.shapeId}`,
      type: simpleShape._type,
      x: simpleShape.x,
      y: simpleShape.y,
      w: simpleShape.w || 100,
      h: simpleShape.h || 100,
      props: simpleShape.props || {},
    };
  }
}
