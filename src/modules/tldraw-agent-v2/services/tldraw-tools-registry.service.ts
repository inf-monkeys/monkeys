import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { ToolsRegistryService } from '../../tools/tools.registry.service';

// Tldraw工具基础接口
export interface TldrawToolDefinition {
  name: string;
  description: string;
  schema: z.ZodType<any>;
  category: 'shape' | 'layout' | 'drawing' | 'external' | 'planning';
  requiresEditor: boolean;
}

// 工具执行上下文
export interface TldrawToolContext {
  editor?: any; // tldraw Editor实例
  sessionId: string;
  userId: string;
  teamId: string;
}

@Injectable()
export class TldrawToolsRegistryService {
  private readonly logger = new Logger(TldrawToolsRegistryService.name);
  private readonly tools = new Map<string, TldrawToolDefinition>();

  constructor(
    private readonly toolsRegistryService: ToolsRegistryService,
  ) {
    this.registerBuiltinTools();
  }

  /**
   * 注册tldraw专用工具
   */
  registerTool(tool: TldrawToolDefinition): void {
    this.tools.set(tool.name, tool);
    this.logger.log(`Registered tldraw tool: ${tool.name}`);
  }

  /**
   * 获取所有tldraw工具定义
   */
  getAllTools(): TldrawToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * 获取指定类别的工具
   */
  getToolsByCategory(category: TldrawToolDefinition['category']): TldrawToolDefinition[] {
    return Array.from(this.tools.values()).filter(tool => tool.category === category);
  }

  /**
   * 获取工具定义
   */
  getTool(name: string): TldrawToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * 注册内置工具
   */
  private registerBuiltinTools(): void {
    // 形状操作工具
    this.registerShapeTools();
    
    // 布局工具
    this.registerLayoutTools();
    
    // 绘图工具
    this.registerDrawingTools();
    
    // 外部API工具
    this.registerExternalTools();
    
    // 规划工具
    this.registerPlanningTools();
  }

  private registerShapeTools(): void {
    // 创建形状工具
    this.registerTool({
      name: 'create_shape',
      description: '在画板上创建新形状',
      schema: z.object({
        _type: z.literal('create'),
        intent: z.string(),
        shape: z.object({
          shapeId: z.string(),
          _type: z.enum(['text', 'line', 'arrow', 'geo', 'note', 'draw']),
          x: z.number(),
          y: z.number(),
          w: z.number().optional(),
          h: z.number().optional(),
          props: z.record(z.string(), z.any()),
        }),
      }),
      category: 'shape',
      requiresEditor: true,
    });

    // 移动形状工具
    this.registerTool({
      name: 'move_shape',
      description: '移动形状到新位置',
      schema: z.object({
        _type: z.literal('move'),
        intent: z.string(),
        shapeId: z.string(),
        x: z.number(),
        y: z.number(),
      }),
      category: 'shape',
      requiresEditor: true,
    });

    // 删除形状工具
    this.registerTool({
      name: 'delete_shape',
      description: '删除指定形状',
      schema: z.object({
        _type: z.literal('delete'),
        intent: z.string(),
        shapeId: z.string(),
      }),
      category: 'shape',
      requiresEditor: true,
    });

    // 更新形状工具
    this.registerTool({
      name: 'update_shape',
      description: '更新形状属性',
      schema: z.object({
        _type: z.literal('update'),
        intent: z.string(),
        shapeId: z.string(),
        props: z.record(z.string(), z.any()),
      }),
      category: 'shape',
      requiresEditor: true,
    });

    // 调整大小工具
    this.registerTool({
      name: 'resize_shape',
      description: '调整形状大小',
      schema: z.object({
        _type: z.literal('resize'),
        intent: z.string(),
        shapeId: z.string(),
        w: z.number().optional(),
        h: z.number().optional(),
        scaleX: z.number().optional(),
        scaleY: z.number().optional(),
      }),
      category: 'shape',
      requiresEditor: true,
    });

    // 旋转形状工具
    this.registerTool({
      name: 'rotate_shape',
      description: '旋转形状',
      schema: z.object({
        _type: z.literal('rotate'),
        intent: z.string(),
        shapeId: z.string(),
        angle: z.number(),
      }),
      category: 'shape',
      requiresEditor: true,
    });

    // 添加标签工具
    this.registerTool({
      name: 'label_shape',
      description: '为形状添加标签',
      schema: z.object({
        _type: z.literal('label'),
        intent: z.string(),
        shapeId: z.string(),
        label: z.string(),
      }),
      category: 'shape',
      requiresEditor: true,
    });
  }

  private registerLayoutTools(): void {
    // 对齐工具
    this.registerTool({
      name: 'align_shapes',
      description: '对齐多个形状',
      schema: z.object({
        _type: z.literal('align'),
        intent: z.string(),
        shapeIds: z.array(z.string()),
        mode: z.enum(['left', 'right', 'top', 'bottom', 'center-x', 'center-y']),
      }),
      category: 'layout',
      requiresEditor: true,
    });

    // 分布工具
    this.registerTool({
      name: 'distribute_shapes',
      description: '分布多个形状',
      schema: z.object({
        _type: z.literal('distribute'),
        intent: z.string(),
        shapeIds: z.array(z.string()),
        mode: z.enum(['horizontal', 'vertical']),
      }),
      category: 'layout',
      requiresEditor: true,
    });

    // 堆叠工具
    this.registerTool({
      name: 'stack_shapes',
      description: '堆叠多个形状',
      schema: z.object({
        _type: z.literal('stack'),
        intent: z.string(),
        shapeIds: z.array(z.string()),
        direction: z.enum(['horizontal', 'vertical']),
        spacing: z.number().optional(),
      }),
      category: 'layout',
      requiresEditor: true,
    });

    // 置于顶层
    this.registerTool({
      name: 'bring_to_front',
      description: '将形状置于顶层',
      schema: z.object({
        _type: z.literal('bring-to-front'),
        intent: z.string(),
        shapeIds: z.array(z.string()),
      }),
      category: 'layout',
      requiresEditor: true,
    });

    // 置于底层
    this.registerTool({
      name: 'send_to_back',
      description: '将形状置于底层',
      schema: z.object({
        _type: z.literal('send-to-back'),
        intent: z.string(),
        shapeIds: z.array(z.string()),
      }),
      category: 'layout',
      requiresEditor: true,
    });

    // 放置工具
    this.registerTool({
      name: 'place_shapes',
      description: '将形状放置到特定位置',
      schema: z.object({
        _type: z.literal('place'),
        intent: z.string(),
        shapeIds: z.array(z.string()),
        x: z.number(),
        y: z.number(),
      }),
      category: 'layout',
      requiresEditor: true,
    });

    // 清空画板
    this.registerTool({
      name: 'clear_canvas',
      description: '清空整个画板',
      schema: z.object({
        _type: z.literal('clear'),
        intent: z.string(),
      }),
      category: 'layout',
      requiresEditor: true,
    });
  }

  private registerDrawingTools(): void {
    // 手绘工具
    this.registerTool({
      name: 'pen_draw',
      description: '手绘自由线条',
      schema: z.object({
        _type: z.literal('pen'),
        intent: z.string(),
        points: z.array(z.object({
          x: z.number(),
          y: z.number(),
        })),
        color: z.string().optional(),
        size: z.number().optional(),
      }),
      category: 'drawing',
      requiresEditor: true,
    });
  }

  private registerExternalTools(): void {
    // 维基百科工具
    this.registerTool({
      name: 'get_wikipedia_article',
      description: '获取随机维基百科文章作为灵感',
      schema: z.object({
        _type: z.literal('getInspiration'),
      }),
      category: 'external',
      requiresEditor: false,
    });

    // 国家信息工具
    this.registerTool({
      name: 'get_country_info',
      description: '根据国家代码获取国家信息',
      schema: z.object({
        _type: z.literal('countryInfo'),
        code: z.string(),
      }),
      category: 'external',
      requiresEditor: false,
    });

    // 统计形状工具
    this.registerTool({
      name: 'count_shapes',
      description: '统计画板上的形状数量',
      schema: z.object({
        _type: z.literal('countShapes'),
        intent: z.string(),
      }),
      category: 'external',
      requiresEditor: true,
    });
  }

  private registerPlanningTools(): void {
    // 思考工具
    this.registerTool({
      name: 'think',
      description: '内部思考和推理过程',
      schema: z.object({
        _type: z.literal('think'),
        text: z.string(),
      }),
      category: 'planning',
      requiresEditor: false,
    });

    // 审查工具
    this.registerTool({
      name: 'review',
      description: '审查和评估当前状态',
      schema: z.object({
        _type: z.literal('review'),
        intent: z.string(),
        criteria: z.array(z.string()).optional(),
      }),
      category: 'planning',
      requiresEditor: false,
    });

    // 添加细节工具
    this.registerTool({
      name: 'add_detail',
      description: '为任务添加更多细节',
      schema: z.object({
        _type: z.literal('addDetail'),
        intent: z.string(),
        detail: z.string(),
      }),
      category: 'planning',
      requiresEditor: false,
    });

    // 设置视图工具
    this.registerTool({
      name: 'set_view',
      description: '设置画板视图',
      schema: z.object({
        _type: z.literal('setMyView'),
        intent: z.string(),
        x: z.number(),
        y: z.number(),
        w: z.number().optional(),
        h: z.number().optional(),
      }),
      category: 'planning',
      requiresEditor: true,
    });

    // 消息工具
    this.registerTool({
      name: 'send_message',
      description: '发送消息给用户',
      schema: z.object({
        _type: z.literal('message'),
        intent: z.string(),
        message: z.string(),
      }),
      category: 'planning',
      requiresEditor: false,
    });
  }
}
