import { Injectable, Logger } from '@nestjs/common';
import { generateText } from 'ai';
import { ModelRegistryService } from './model-registry.service';

/**
 * 思维图谱节点类型
 */
export enum MindMapNodeType {
  /** 需求 */
  REQUIREMENT = 'requirement',
  /** 功能 */
  FEATURE = 'feature',
  /** 逻辑 */
  LOGIC = 'logic',
  /** 原型 */
  PROTOTYPE = 'prototype',
}

/**
 * 思维图谱节点
 */
export interface MindMapNode {
  /** 节点ID */
  id: string;
  /** 节点标签 */
  label: string;
  /** 节点类型 */
  type: MindMapNodeType;
  /** 节点描述 */
  description?: string;
  /** 层级 */
  level: number;
}

/**
 * 思维图谱边
 */
export interface MindMapEdge {
  /** 边ID */
  id: string;
  /** 源节点ID */
  from: string;
  /** 目标节点ID */
  to: string;
  /** 边标签 */
  label?: string;
}

/**
 * 思维图谱生成请求
 */
export interface MindMapGenerationRequest {
  teamId: string;
  userId: string;
  threadId?: string;
  /** 选中的图形数据 */
  shapes: any[];
  /** 画布上下文（可选） */
  canvasData?: any;
}

/**
 * 思维图谱生成响应
 */
export interface MindMapGenerationResponse {
  /** 节点列表 */
  nodes: MindMapNode[];
  /** 边列表 */
  edges: MindMapEdge[];
  /** 生成摘要 */
  summary: string;
  /** 处理耗时（毫秒） */
  processingTime: number;
}

/**
 * Mind Map Generation Service
 *
 * **职责**：
 * - 使用 AI 分析画板中的图形，生成思维图谱
 * - 按照需求→功能→逻辑→原型的因果映射关系组织内容
 * - 生成可编辑的层级化图谱结构
 */
@Injectable()
export class MindMapGenerationService {
  private readonly logger = new Logger(MindMapGenerationService.name);

  constructor(private readonly modelRegistry: ModelRegistryService) {}

  /**
   * 生成思维图谱
   */
  async generateMindMap(
    request: MindMapGenerationRequest,
  ): Promise<MindMapGenerationResponse> {
    const startTime = Date.now();
    this.logger.log(
      `Generating mind map for ${request.shapes.length} shapes in team ${request.teamId}`,
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
      const { nodes, edges } = this.parseAIResponse(analysisResult);

      // 5. 生成摘要
      const summary = this.generateSummary(nodes, edges);

      const processingTime = Date.now() - startTime;

      this.logger.log(
        `Generated mind map with ${nodes.length} nodes and ${edges.length} edges in ${processingTime}ms`,
      );

      return {
        nodes,
        edges,
        summary,
        processingTime,
      };
    } catch (error) {
      this.logger.error('Failed to generate mind map', error.stack);
      throw error;
    }
  }

  /**
   * 格式化图形数据用于 AI 分析
   */
  private formatShapesForAnalysis(shapes: any[]): string {
    const formatted = shapes.map((shape, index) => {
      const parts: string[] = [
        `图形 ${index + 1}:`,
        `  ID: ${shape.id}`,
        `  类型: ${shape.type}`,
      ];

      // 提取文本内容
      if (shape.props?.text) {
        parts.push(`  文本: "${shape.props.text}"`);
      }

      // 提取位置信息
      if (shape.x !== undefined && shape.y !== undefined) {
        parts.push(`  位置: (${Math.round(shape.x)}, ${Math.round(shape.y)})`);
      }

      // 提取标签/名称
      if (shape.props?.label) {
        parts.push(`  标签: "${shape.props.label}"`);
      }

      // 提取颜色
      if (shape.props?.color) {
        parts.push(`  颜色: ${shape.props.color}`);
      }

      return parts.join('\n');
    });

    return formatted.join('\n\n');
  }

  /**
   * 构建分析提示词
   */
  private buildAnalysisPrompt(shapesContext: string): string {
    return `你是一个专业的语义网络（Semantic Network）知识图谱生成专家。请分析以下画板中的图形，生成一个标准的语义网络图谱。

## 图形信息

${shapesContext}

## 语义网络结构说明

语义网络是一种用节点和边表示知识的图结构：

**节点（Node）**：表示概念、实体、模块、组件、属性等
**边（Edge）**：表示语义关系，如：
- 组成关系：A 由 B 组成
- 依赖关系：A 依赖于 B
- 支持关系：A 支持 B
- 实现关系：A 实现 B
- 包含关系：A 包含 B
- 需求映射：需求 A 对应功能 B

## 节点类型分类

请将节点分为以下四类：

1. **requirement (需求)** - 核心需求、目标、问题定义
2. **feature (功能)** - 功能模块、能力、特性
3. **logic (逻辑)** - 系统、子系统、实现逻辑、技术方案
4. **prototype (原型)** - 具体组件、材料、实施方案

## 分析策略

1. **识别中心节点**：找出最核心的概念作为中心（通常是整体目标或系统名称）
2. **识别周边节点**：找出支撑中心的各个组成部分、模块、能力
3. **建立语义关系**：
   - 从中心向外辐射：表示"由…组成"、"包含"、"依赖"
   - 同层节点间：表示"协作"、"支持"
   - 跨层连接：表示"实现"、"映射"

4. **分配节点类型**：
   - requirement：整体目标、核心需求
   - feature：功能能力、特性
   - logic：技术系统、控制模块
   - prototype：具体材料、组件

## 输出格式

请以 JSON 格式输出，格式如下：

\`\`\`json
{
  "nodes": [
    {
      "id": "center",
      "label": "中心节点名称",
      "type": "requirement|feature|logic|prototype",
      "description": "节点描述（可选）",
      "level": 0
    },
    {
      "id": "node_1",
      "label": "周边节点名称",
      "type": "requirement|feature|logic|prototype",
      "description": "节点描述（可选）",
      "level": 1
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "from": "center",
      "to": "node_1",
      "label": "组成|依赖|支持|实现|包含"
    }
  ],
  "analysis": "语义网络分析摘要（2-3句话）"
}
\`\`\`

## 重要约定

1. **第一个节点必须是中心节点**（level=0），其他节点围绕它展开
2. **边的方向**：通常从中心指向外围，或从高层指向低层
3. **边的标签**：清晰说明语义关系（如"由…组成"、"支持"、"实现"等）
4. **节点类型**：根据语义准确分类
5. **nodes 和 edges 数组不能为空**

现在开始分析并生成语义网络：`;
  }

  /**
   * 使用 AI 模型进行分析
   */
  private async analyzeWithAI(
    prompt: string,
    teamId: string,
    userId: string,
  ): Promise<string> {
    const availableModels = this.modelRegistry.listModels(teamId);

    if (!availableModels || availableModels.length === 0) {
      throw new Error('No available AI model for mind map generation');
    }

    const selectedModelConfig =
      availableModels.find((m) => m.supportsTools) || availableModels[0];

    this.logger.debug(`Using model ${selectedModelConfig.id} for mind map generation`);

    const model = this.modelRegistry.resolveModel(selectedModelConfig.id);

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
        temperature: 0.4, // 适中温度，保持创造性和稳定性的平衡
      });

      return result.text;
    } catch (error) {
      this.logger.error('AI model analysis failed', error.stack);
      throw new Error(`Failed to generate mind map: ${error.message}`);
    }
  }

  /**
   * 解析 AI 返回的分析结果
   */
  private parseAIResponse(aiResponse: string): {
    nodes: MindMapNode[];
    edges: MindMapEdge[];
  } {
    try {
      // 提取 JSON 部分
      let jsonStr = aiResponse.trim();

      const jsonMatch = jsonStr.match(/```json\s*\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      } else {
        const jsonStart = jsonStr.indexOf('{');
        const jsonEnd = jsonStr.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
        }
      }

      const parsed = JSON.parse(jsonStr);

      const nodes: MindMapNode[] = [];
      const edges: MindMapEdge[] = [];

      // 解析节点
      if (Array.isArray(parsed.nodes)) {
        for (const node of parsed.nodes) {
          // 验证节点类型
          if (!Object.values(MindMapNodeType).includes(node.type)) {
            this.logger.warn(
              `Unknown node type: ${node.type}, defaulting to 'requirement'`,
            );
            node.type = MindMapNodeType.REQUIREMENT;
          }

          nodes.push({
            id: node.id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            label: node.label || '未命名节点',
            type: node.type as MindMapNodeType,
            description: node.description,
            level: node.level || 1,
          });
        }
      }

      // 解析边
      if (Array.isArray(parsed.edges)) {
        const nodeIds = new Set(nodes.map((n) => n.id));

        for (const edge of parsed.edges) {
          // 验证节点ID存在
          if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
            this.logger.warn(
              `Skipping edge with invalid node IDs: ${edge.from} -> ${edge.to}`,
            );
            continue;
          }

          edges.push({
            id: edge.id || `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            from: edge.from,
            to: edge.to,
            label: edge.label,
          });
        }
      }

      // 兜底策略：如果解析结果为空，创建基础结构
      if (nodes.length === 0) {
        this.logger.warn('AI did not return valid nodes, creating fallback structure');
        nodes.push({
          id: 'node_fallback_1',
          label: '设计元素',
          type: MindMapNodeType.REQUIREMENT,
          description: '需要进一步分析的设计元素',
          level: 1,
        });
      }

      return { nodes, edges };
    } catch (error) {
      this.logger.error('Failed to parse AI response', error.stack);
      this.logger.debug('Raw AI response:', aiResponse);

      // 兜底策略：返回基础结构
      return {
        nodes: [
          {
            id: 'node_error_1',
            label: '设计元素',
            type: MindMapNodeType.REQUIREMENT,
            description: '解析失败，需要手动编辑',
            level: 1,
          },
        ],
        edges: [],
      };
    }
  }

  /**
   * 生成语义网络摘要
   */
  private generateSummary(nodes: MindMapNode[], edges: MindMapEdge[]): string {
    if (nodes.length === 0) {
      return '未能生成语义网络图谱。';
    }

    // 识别中心节点（第一个节点或 level=0 的节点）
    const centerNode = nodes.find((n) => n.level === 0) || nodes[0];

    // 按类型统计节点
    const typeCount: Record<string, number> = {};
    for (const node of nodes) {
      typeCount[node.type] = (typeCount[node.type] || 0) + 1;
    }

    const typeSummary = Object.entries(typeCount)
      .map(([type, count]) => {
        const typeName = this.getNodeTypeName(type as MindMapNodeType);
        return `${count}个${typeName}`;
      })
      .join('、');

    return `已生成语义网络图谱，以"${centerNode.label}"为中心，包含 ${nodes.length} 个节点（${typeSummary}）和 ${edges.length} 个语义关系，展现了完整的知识结构。`;
  }

  /**
   * 获取节点类型的中文名称
   */
  private getNodeTypeName(type: MindMapNodeType): string {
    const names: Record<MindMapNodeType, string> = {
      [MindMapNodeType.REQUIREMENT]: '需求',
      [MindMapNodeType.FEATURE]: '功能',
      [MindMapNodeType.LOGIC]: '逻辑',
      [MindMapNodeType.PROTOTYPE]: '原型',
    };
    return names[type] || type;
  }
}
