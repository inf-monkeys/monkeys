import { Injectable, Logger } from '@nestjs/common';
import { generateText } from 'ai';
import { ModelRegistryService } from './model-registry.service';
import { MindMapNode, MindMapEdge } from './mind-map-generation.service';

/**
 * 思维图谱洞察类型
 */
export enum MindMapInsightType {
  /** 生成方案 */
  SOLUTION = 'solution',
  /** 提供创意 */
  CREATIVITY = 'creativity',
  /** 挖掘关系 */
  RELATIONSHIP = 'relationship',
}

/**
 * 思维图谱洞察请求
 */
export interface MindMapInsightRequest {
  teamId: string;
  userId: string;
  /** 洞察类型 */
  insightType: MindMapInsightType;
  /** 当前的节点列表 */
  nodes: MindMapNode[];
  /** 当前的边列表 */
  edges: MindMapEdge[];
}

/**
 * 思维图谱洞察响应
 */
export interface MindMapInsightResponse {
  /** 生成的洞察文本 */
  insight: string;
  /** 洞察类型 */
  type: MindMapInsightType;
  /** 处理耗时（毫秒） */
  processingTime: number;
}

/**
 * Mind Map Insight Service
 *
 * **职责**：
 * - 根据当前知识图谱生成AI洞察
 * - 支持三种类型：生成方案、提供创意、挖掘关系
 * - 为用户提供智能化的思维扩展建议
 */
@Injectable()
export class MindMapInsightService {
  private readonly logger = new Logger(MindMapInsightService.name);

  constructor(private readonly modelRegistry: ModelRegistryService) {}

  /**
   * 生成思维图谱洞察
   */
  async generateInsight(
    request: MindMapInsightRequest,
  ): Promise<MindMapInsightResponse> {
    const startTime = Date.now();
    this.logger.log(
      `Generating ${request.insightType} insight for ${request.nodes.length} nodes`,
    );

    try {
      // 1. 构建分析提示词
      const prompt = this.buildInsightPrompt(
        request.insightType,
        request.nodes,
        request.edges,
      );

      // 2. 调用 AI 模型生成洞察
      const insight = await this.generateWithAI(
        prompt,
        request.teamId,
        request.userId,
      );

      const processingTime = Date.now() - startTime;

      this.logger.log(
        `Generated ${request.insightType} insight in ${processingTime}ms`,
      );

      return {
        insight,
        type: request.insightType,
        processingTime,
      };
    } catch (error) {
      this.logger.error('Failed to generate insight', error.stack);
      throw error;
    }
  }

  /**
   * 构建洞察生成提示词
   */
  private buildInsightPrompt(
    insightType: MindMapInsightType,
    nodes: MindMapNode[],
    edges: MindMapEdge[],
  ): string {
    // 格式化节点信息
    const nodesContext = this.formatNodesContext(nodes);

    // 格式化边信息
    const edgesContext = this.formatEdgesContext(edges, nodes);

    // 根据洞察类型构建不同的提示词
    switch (insightType) {
      case MindMapInsightType.SOLUTION:
        return this.buildSolutionPrompt(nodesContext, edgesContext);

      case MindMapInsightType.CREATIVITY:
        return this.buildCreativityPrompt(nodesContext, edgesContext);

      case MindMapInsightType.RELATIONSHIP:
        return this.buildRelationshipPrompt(nodesContext, edgesContext);

      default:
        throw new Error(`Unknown insight type: ${insightType}`);
    }
  }

  /**
   * 格式化节点上下文
   */
  private formatNodesContext(nodes: MindMapNode[]): string {
    const nodeTypeNames = {
      requirement: '需求',
      feature: '功能',
      logic: '逻辑',
      prototype: '原型',
    };

    const formatted = nodes.map((node, index) => {
      const parts: string[] = [
        `节点 ${index + 1}: ${node.label}`,
        `  类型: ${nodeTypeNames[node.type as keyof typeof nodeTypeNames]}`,
        `  层级: ${node.level}`,
      ];

      if (node.description) {
        parts.push(`  描述: ${node.description}`);
      }

      return parts.join('\n');
    });

    return formatted.join('\n\n');
  }

  /**
   * 格式化边上下文
   */
  private formatEdgesContext(edges: MindMapEdge[], nodes: MindMapNode[]): string {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    const formatted = edges.map((edge, index) => {
      const fromNode = nodeMap.get(edge.from);
      const toNode = nodeMap.get(edge.to);

      const parts: string[] = [
        `关系 ${index + 1}: ${fromNode?.label || edge.from} → ${toNode?.label || edge.to}`,
      ];

      if (edge.label) {
        parts.push(`  关系类型: ${edge.label}`);
      }

      return parts.join('\n');
    });

    return formatted.join('\n\n');
  }

  /**
   * 构建生成方案提示词
   */
  private buildSolutionPrompt(nodesContext: string, edgesContext: string): string {
    return `你是一个专业的方案设计师。请基于以下知识图谱，生成一个可执行的实施方案。

## 当前知识图谱

### 节点信息
${nodesContext}

### 关系信息
${edgesContext}

## 任务要求

请分析以上知识图谱的内容，生成一个具体、可执行的实施方案。方案应该：

1. **全局视角**：基于需求→功能→逻辑→原型的完整映射
2. **实施步骤**：给出清晰的、分阶段的实施步骤
3. **优先级排序**：指明哪些部分应该优先实施
4. **可行性分析**：简要说明方案的可行性和潜在风险
5. **资源规划**：提示需要的关键资源或技术

## 输出格式

请以2-4段文字输出方案（每段80-150字），包含：
- 第一段：方案概述和核心思路
- 第二段：具体实施步骤和优先级
- 第三段：可行性分析和风险提示（如适用）
- 第四段：资源规划和下一步建议（如适用）

注意：
- 文字要精炼、直接、可操作
- 避免空泛的建议
- 紧扣知识图谱的具体内容`;
  }

  /**
   * 构建提供创意提示词
   */
  private buildCreativityPrompt(nodesContext: string, edgesContext: string): string {
    return `你是一个富有创造力的创意顾问。请基于以下知识图谱，提供创新的想法和灵感。

## 当前知识图谱

### 节点信息
${nodesContext}

### 关系信息
${edgesContext}

## 任务要求

请分析以上知识图谱的内容，提供创意建议。创意应该：

1. **跳出框架**：提供一些意想不到的角度或方向
2. **启发思考**：激发新的可能性和想法
3. **多样化**：从不同维度提供创意（技术、用户体验、商业模式等）
4. **可延展**：创意应该能够与现有内容产生联系
5. **具体可行**：虽然创新，但不是天马行空

## 输出格式

请以2-4段文字输出创意（每段80-150字），可以包含：
- 第一段：从全新角度重新审视现有内容
- 第二段：提出2-3个具体的创新想法或方向
- 第三段：启发性的问题或思考方向
- 第四段：灵感来源或参考案例（如适用）

注意：
- 保持创意的可行性
- 与现有知识图谱内容相关联
- 语言要生动、有启发性`;
  }

  /**
   * 构建挖掘关系提示词
   */
  private buildRelationshipPrompt(nodesContext: string, edgesContext: string): string {
    return `你是一个专业的知识图谱分析师。请深入分析以下知识图谱，挖掘隐藏的关系和洞察。

## 当前知识图谱

### 节点信息
${nodesContext}

### 关系信息
${edgesContext}

## 任务要求

请分析以上知识图谱，深入挖掘节点之间的关系。分析应该包括:

1. **现有关系总结**：梳理当前已有的关系模式
2. **隐藏关系发现**：识别尚未明确标注但存在的潜在关系
3. **关系强度分析**：哪些关系是核心的、关键的
4. **缺失关系提示**：指出可能缺失但应该建立的关系
5. **关系优化建议**：如何优化现有的关系结构

## 输出格式

请以2-4段文字输出分析（每段80-150字），包含：
- 第一段：当前关系结构的总体评估
- 第二段：发现的隐藏关系或模式
- 第三段：关键关系和瓶颈识别
- 第四段：优化建议和补充方向

注意：
- 分析要有深度和洞察力
- 指出具体的节点和关系
- 提供可操作的建议`;
  }

  /**
   * 使用 AI 模型生成洞察
   */
  private async generateWithAI(
    prompt: string,
    teamId: string,
    userId: string,
  ): Promise<string> {
    const availableModels = this.modelRegistry.listModels(teamId);

    if (!availableModels || availableModels.length === 0) {
      throw new Error('No available AI model for insight generation');
    }

    const selectedModelConfig =
      availableModels.find((m) => m.supportsTools) || availableModels[0];

    this.logger.debug(`Using model ${selectedModelConfig.id} for insight generation`);

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
        temperature: 0.7, // 较高温度，保持创造性
      });

      return result.text.trim();
    } catch (error) {
      this.logger.error('AI model generation failed', error.stack);
      throw new Error(`Failed to generate insight: ${error.message}`);
    }
  }
}
