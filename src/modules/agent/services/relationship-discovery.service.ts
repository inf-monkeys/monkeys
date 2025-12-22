import { Injectable, Logger } from '@nestjs/common';
import { generateText } from 'ai';
import { ModelRegistryService } from './model-registry.service';

/**
 * 逻辑关系类型
 */
export enum RelationshipType {
  /** 基础相关关系 */
  RELATED = 'related',
  /** 需求到功能的映射 */
  REQUIREMENT_TO_FEATURE = 'requirement_to_feature',
  /** 功能到逻辑的映射 */
  FEATURE_TO_LOGIC = 'feature_to_logic',
  /** 逻辑到原型的映射 */
  LOGIC_TO_PROTOTYPE = 'logic_to_prototype',
  /** 依赖关系 */
  DEPENDS_ON = 'depends_on',
  /** 包含关系 */
  CONTAINS = 'contains',
  /** 因果关系 */
  CAUSES = 'causes',
}

/**
 * 关系发现结果
 */
export interface DiscoveredRelationship {
  /** 关系ID */
  id: string;
  /** 关系类型 */
  type: RelationshipType;
  /** 源图形ID */
  sourceShapeId: string;
  /** 目标图形ID */
  targetShapeId: string;
  /** 关系描述 */
  description: string;
  /** 置信度 0-1 */
  confidence: number;
  /** 额外元数据 */
  metadata?: Record<string, any>;
}

/**
 * 关系发现请求
 */
export interface RelationshipDiscoveryRequest {
  teamId: string;
  userId: string;
  threadId?: string;
  /** 选中的图形数据 */
  shapes: any[];
  /** 画布上下文（可选，用于更全面的分析） */
  canvasData?: any;
}

/**
 * 关系发现响应
 */
export interface RelationshipDiscoveryResponse {
  /** 发现的关系列表 */
  relationships: DiscoveredRelationship[];
  /** 分析摘要 */
  summary: string;
  /** 处理耗时（毫秒） */
  processingTime: number;
}

/**
 * Relationship Discovery Service
 *
 * **职责**：
 * - 使用 AI 分析画板中选中图形之间的逻辑关系
 * - 识别需求-功能-逻辑-原型的因果映射关系
 * - 发现基础相关关系、依赖关系等
 */
@Injectable()
export class RelationshipDiscoveryService {
  private readonly logger = new Logger(RelationshipDiscoveryService.name);

  constructor(private readonly modelRegistry: ModelRegistryService) {}

  /**
   * 发现选中图形之间的逻辑关系
   */
  async discoverRelationships(
    request: RelationshipDiscoveryRequest,
  ): Promise<RelationshipDiscoveryResponse> {
    const startTime = Date.now();
    this.logger.log(
      `Discovering relationships for ${request.shapes.length} shapes in team ${request.teamId}`,
    );

    try {
      // 1. 准备图形数据
      const shapesContext = this.formatShapesForAnalysis(request.shapes);

      // 2. 构建分析提示词
      const prompt = this.buildAnalysisPrompt(shapesContext);

      // 3. 调用 AI 模型分析
      const analysisResult = await this.analyzeWithAI(
        prompt,
        request.teamId,
        request.userId,
      );

      // 4. 解析结果
      const relationships = this.parseAIResponse(analysisResult, request.shapes);

      // 5. 生成摘要
      const summary = this.generateSummary(relationships);

      const processingTime = Date.now() - startTime;

      this.logger.log(
        `Discovered ${relationships.length} relationships in ${processingTime}ms`,
      );

      return {
        relationships,
        summary,
        processingTime,
      };
    } catch (error) {
      this.logger.error('Failed to discover relationships', error.stack);
      throw error;
    }
  }

  /**
   * 格式化图形数据用于 AI 分析
   */
  private formatShapesForAnalysis(shapes: any[]): string {
    const formatted = shapes.map((shape, index) => {
      const parts: string[] = [
        `Shape ${index + 1}:`,
        `  ID: ${shape.id}`,
        `  Type: ${shape.type}`,
      ];

      // 提取文本内容
      if (shape.props?.text) {
        parts.push(`  Text: "${shape.props.text}"`);
      }

      // 提取位置信息
      if (shape.x !== undefined && shape.y !== undefined) {
        parts.push(`  Position: (${Math.round(shape.x)}, ${Math.round(shape.y)})`);
      }

      // 提取尺寸信息
      if (shape.props?.w && shape.props?.h) {
        parts.push(`  Size: ${Math.round(shape.props.w)} x ${Math.round(shape.props.h)}`);
      }

      // 提取标签/名称
      if (shape.props?.label) {
        parts.push(`  Label: "${shape.props.label}"`);
      }

      // 提取颜色
      if (shape.props?.color) {
        parts.push(`  Color: ${shape.props.color}`);
      }

      return parts.join('\n');
    });

    return formatted.join('\n\n');
  }

  /**
   * 构建分析提示词
   */
  private buildAnalysisPrompt(shapesContext: string): string {
    return `你是一个专业的设计逻辑关系分析助手。请分析以下画板中选中的图形，发现它们之间的逻辑关系。

## 图形信息

${shapesContext}

## 关系类型说明

请识别以下类型的关系：

1. **related** - 基础相关关系：图形在内容或功能上有关联
2. **requirement_to_feature** - 需求到功能：需求描述对应的功能实现
3. **feature_to_logic** - 功能到逻辑：功能对应的业务逻辑
4. **logic_to_prototype** - 逻辑到原型：逻辑对应的界面原型
5. **depends_on** - 依赖关系：一个元素依赖另一个元素
6. **contains** - 包含关系：一个元素包含另一个元素
7. **causes** - 因果关系：一个元素导致另一个元素

## 分析要求

1. 仔细分析每个图形的类型、位置、内容（文本、标签）
2. 根据图形的语义内容和空间位置判断关系
3. 识别设计流程中的需求→功能→逻辑→原型映射链
4. 对每个关系给出0-1之间的置信度评分
5. 为每个关系提供简洁的描述（20-50字）
6. **必须至少识别出1个关系**，即使置信度较低也要给出最可能的关系

## 分析策略

- **空间位置关系**：相邻或垂直/水平对齐的图形可能存在流程关系或依赖关系
- **内容语义关系**：分析文本内容，识别需求描述、功能说明、逻辑流程、界面原型等
- **类型推断**：根据图形类型（文本框、形状、流程图等）推断其在设计中的角色
- **兜底策略**：如果无法识别明确关系，至少标记为"相关关系"，说明它们在同一设计上下文中

## 输出格式

请以 JSON 格式输出，格式如下：

\`\`\`json
{
  "relationships": [
    {
      "type": "relationship_type",
      "sourceShapeId": "shape_id_1",
      "targetShapeId": "shape_id_2",
      "description": "关系描述",
      "confidence": 0.85
    }
  ],
  "analysis": "整体分析摘要（2-3句话）"
}
\`\`\`

注意事项：
- sourceShapeId 和 targetShapeId 必须是上述图形的真实 ID
- 对于双向关系，请创建两条记录
- **relationships 数组不能为空**，必须至少包含1个关系
- 只返回置信度 >= 0.5 的关系（降低阈值以确保有结果）
- 如果难以判断具体类型，使用 "related" 类型并详细说明关联原因

现在开始分析：`;
  }

  /**
   * 使用 AI 模型进行分析
   */
  private async analyzeWithAI(
    prompt: string,
    teamId: string,
    userId: string,
  ): Promise<string> {
    // 获取可用模型列表，选择第一个支持工具的模型
    const availableModels = this.modelRegistry.listModels(teamId);

    if (!availableModels || availableModels.length === 0) {
      throw new Error('No available AI model for relationship analysis');
    }

    // 优先选择支持工具调用的模型
    const selectedModelConfig =
      availableModels.find((m) => m.supportsTools) || availableModels[0];

    this.logger.debug(`Using model ${selectedModelConfig.id} for analysis`);

    // 解析并获取模型实例
    const model = this.modelRegistry.resolveModel(selectedModelConfig.id);

    // 调用模型
    const messages = [
      {
        role: 'user' as const,
        content: prompt,
      },
    ];

    try {
      const result = await generateText({
        model,
        messages,
        temperature: 0.3, // 较低温度以获得更稳定的结果
      });

      return result.text;
    } catch (error) {
      this.logger.error('AI model analysis failed', error.stack);
      throw new Error(`Failed to analyze relationships: ${error.message}`);
    }
  }

  /**
   * 解析 AI 返回的分析结果
   */
  private parseAIResponse(
    aiResponse: string,
    shapes: any[],
  ): DiscoveredRelationship[] {
    try {
      // 提取 JSON 部分（可能包含在 markdown 代码块中）
      let jsonStr = aiResponse.trim();

      // 去除 markdown 代码块标记
      const jsonMatch = jsonStr.match(/```json\s*\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      } else {
        // 尝试找到纯 JSON 内容
        const jsonStart = jsonStr.indexOf('{');
        const jsonEnd = jsonStr.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
        }
      }

      const parsed = JSON.parse(jsonStr);

      // 验证并构建关系对象
      const shapeIds = new Set(shapes.map((s) => s.id));
      const relationships: DiscoveredRelationship[] = [];

      if (Array.isArray(parsed.relationships)) {
        for (const rel of parsed.relationships) {
          // 验证图形ID存在
          if (!shapeIds.has(rel.sourceShapeId) || !shapeIds.has(rel.targetShapeId)) {
            this.logger.warn(
              `Skipping relationship with invalid shape IDs: ${rel.sourceShapeId} -> ${rel.targetShapeId}`,
            );
            continue;
          }

          // 验证关系类型
          if (!Object.values(RelationshipType).includes(rel.type)) {
            this.logger.warn(`Unknown relationship type: ${rel.type}, defaulting to 'related'`);
            rel.type = RelationshipType.RELATED;
          }

          relationships.push({
            id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: rel.type as RelationshipType,
            sourceShapeId: rel.sourceShapeId,
            targetShapeId: rel.targetShapeId,
            description: rel.description || 'No description provided',
            confidence: Math.max(0, Math.min(1, rel.confidence || 0.7)),
            metadata: rel.metadata,
          });
        }
      }

      // 兜底策略：如果没有识别出任何关系，创建基础的空间关系
      if (relationships.length === 0 && shapes.length >= 2) {
        this.logger.warn('AI did not return any relationships, creating fallback relationships');

        // 为相邻的图形创建"相关关系"
        for (let i = 0; i < shapes.length - 1; i++) {
          relationships.push({
            id: `rel_fallback_${Date.now()}_${i}`,
            type: RelationshipType.RELATED,
            sourceShapeId: shapes[i].id,
            targetShapeId: shapes[i + 1].id,
            description: `这两个元素在同一设计空间中，可能存在某种关联`,
            confidence: 0.5,
          });
        }
      }

      return relationships;
    } catch (error) {
      this.logger.error('Failed to parse AI response', error.stack);
      this.logger.debug('Raw AI response:', aiResponse);

      // 兜底策略：解析失败时创建基础关系
      const relationships: DiscoveredRelationship[] = [];
      if (shapes.length >= 2) {
        for (let i = 0; i < shapes.length - 1; i++) {
          relationships.push({
            id: `rel_error_${Date.now()}_${i}`,
            type: RelationshipType.RELATED,
            sourceShapeId: shapes[i].id,
            targetShapeId: shapes[i + 1].id,
            description: `这两个元素在同一设计空间中，可能存在某种关联`,
            confidence: 0.5,
          });
        }
      }
      return relationships;
    }
  }

  /**
   * 生成关系发现摘要
   */
  private generateSummary(relationships: DiscoveredRelationship[]): string {
    if (relationships.length === 0) {
      return '未发现明显的逻辑关系。';
    }

    // 按类型统计
    const typeCount: Record<string, number> = {};
    for (const rel of relationships) {
      typeCount[rel.type] = (typeCount[rel.type] || 0) + 1;
    }

    const typeSummary = Object.entries(typeCount)
      .map(([type, count]) => {
        const typeName = this.getRelationshipTypeName(type as RelationshipType);
        return `${count}个${typeName}`;
      })
      .join('、');

    // 计算平均置信度
    const avgConfidence =
      relationships.reduce((sum, rel) => sum + rel.confidence, 0) / relationships.length;
    const confidenceDesc =
      avgConfidence >= 0.8 ? '高' : avgConfidence >= 0.6 ? '中等' : '较低';

    return `共发现 ${relationships.length} 个逻辑关系（${typeSummary}），平均置信度：${confidenceDesc}（${(avgConfidence * 100).toFixed(0)}%）。`;
  }

  /**
   * 获取关系类型的中文名称
   */
  private getRelationshipTypeName(type: RelationshipType): string {
    const names: Record<RelationshipType, string> = {
      [RelationshipType.RELATED]: '相关关系',
      [RelationshipType.REQUIREMENT_TO_FEATURE]: '需求→功能',
      [RelationshipType.FEATURE_TO_LOGIC]: '功能→逻辑',
      [RelationshipType.LOGIC_TO_PROTOTYPE]: '逻辑→原型',
      [RelationshipType.DEPENDS_ON]: '依赖关系',
      [RelationshipType.CONTAINS]: '包含关系',
      [RelationshipType.CAUSES]: '因果关系',
    };
    return names[type] || type;
  }
}
