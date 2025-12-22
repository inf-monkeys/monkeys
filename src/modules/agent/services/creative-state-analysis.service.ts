import { Injectable, Logger } from '@nestjs/common';
import { ModelRegistryService } from './model-registry.service';
import { generateText } from 'ai';

/**
 * 创作状态类型
 */
export enum CreativeState {
  /** 发散状态 - 思维扩散,大量探索 */
  DIVERGENT = 'divergent',
  /** 收敛状态 - 思维收敛,整理归纳 */
  CONVERGENT = 'convergent',
  /** 停滞状态 - 缺乏进展,需要灵感 */
  STAGNANT = 'stagnant',
}

/**
 * 创作状态分析请求
 */
export interface CreativeStateAnalysisRequest {
  teamId: string;
  userId: string;
  threadId: string;
  /** 画布数据 */
  canvasData: any;
  /** 选中的图形ID（可选） */
  selectedShapeIds?: string[];
  /** 视口信息（可选） */
  viewport?: { x: number; y: number; zoom: number };
}

/**
 * 创作状态分析结果
 */
export interface CreativeStateAnalysisResult {
  /** 创作状态 */
  state: CreativeState;
  /** 置信度 0-1 */
  confidence: number;
  /** 状态描述 */
  description: string;
  /** 灵感建议列表 */
  suggestions: InspirationSuggestion[];
  /** 分析摘要 */
  summary: string;
  /** 处理耗时（毫秒） */
  processingTime: number;
}

/**
 * 灵感建议
 */
export interface InspirationSuggestion {
  /** 建议类型 */
  type: 'question' | 'idea' | 'action' | 'resource';
  /** 建议标题 */
  title: string;
  /** 建议内容 */
  content: string;
  /** 优先级 1-5, 5最高 */
  priority: number;
}

/**
 * Creative State Analysis Service
 *
 * **职责**：
 * - 分析用户在画布上的创作状态（发散/收敛/停滞）
 * - 基于当前画布内容生成智能灵感推送
 * - 使用AI模型进行语义分析
 */
@Injectable()
export class CreativeStateAnalysisService {
  private readonly logger = new Logger(CreativeStateAnalysisService.name);

  constructor(private readonly modelRegistry: ModelRegistryService) {}

  /**
   * 分析当前创作状态并生成灵感建议
   */
  async analyzeCreativeState(
    request: CreativeStateAnalysisRequest,
  ): Promise<CreativeStateAnalysisResult> {
    const startTime = Date.now();
    this.logger.log(
      `Analyzing creative state for thread ${request.threadId} in team ${request.teamId}`,
    );

    try {
      // 1. 提取画布特征
      const canvasFeatures = this.extractCanvasFeatures(request.canvasData);

      // 2. 构建分析提示词
      const prompt = this.buildAnalysisPrompt(canvasFeatures);

      // 3. 调用AI模型分析
      const analysisResult = await this.analyzeWithAI(
        prompt,
        request.teamId,
        request.userId,
      );

      // 4. 解析AI返回结果
      const result = this.parseAnalysisResult(analysisResult);

      const processingTime = Date.now() - startTime;
      result.processingTime = processingTime;

      this.logger.log(
        `Creative state analysis completed: ${result.state} (confidence: ${(result.confidence * 100).toFixed(0)}%) in ${processingTime}ms`,
      );

      return result;
    } catch (error) {
      this.logger.error('Failed to analyze creative state', error.stack);
      throw error;
    }
  }

  /**
   * 提取画布特征用于分析
   */
  private extractCanvasFeatures(canvasData: any): {
    totalShapes: number;
    shapeTypes: Record<string, number>;
    hasText: boolean;
    textContent: string[];
    spatialDistribution: string;
    complexity: string;
  } {
    const shapes = canvasData?.shapes || [];
    const totalShapes = shapes.length;

    // 统计图形类型
    const shapeTypes: Record<string, number> = {};
    const textContent: string[] = [];
    let hasText = false;

    for (const shape of shapes) {
      const type = shape.type || 'unknown';
      shapeTypes[type] = (shapeTypes[type] || 0) + 1;

      // 提取文本内容
      if (shape.props?.text && typeof shape.props.text === 'string') {
        hasText = true;
        const text = shape.props.text.trim();
        if (text.length > 0 && text.length <= 100) {
          textContent.push(text);
        }
      }
      if (shape.props?.label && typeof shape.props.label === 'string') {
        const label = shape.props.label.trim();
        if (label.length > 0 && label.length <= 100) {
          textContent.push(label);
        }
      }
    }

    // 分析空间分布（简化版本）
    let spatialDistribution = 'unknown';
    if (totalShapes > 0) {
      const typeCount = Object.keys(shapeTypes).length;
      if (typeCount === 1) {
        spatialDistribution = 'uniform';
      } else if (typeCount >= totalShapes * 0.5) {
        spatialDistribution = 'scattered';
      } else {
        spatialDistribution = 'clustered';
      }
    }

    // 复杂度评估
    let complexity = 'empty';
    if (totalShapes === 0) {
      complexity = 'empty';
    } else if (totalShapes <= 5) {
      complexity = 'minimal';
    } else if (totalShapes <= 15) {
      complexity = 'moderate';
    } else if (totalShapes <= 30) {
      complexity = 'rich';
    } else {
      complexity = 'very_complex';
    }

    return {
      totalShapes,
      shapeTypes,
      hasText,
      textContent: textContent.slice(0, 20), // 只取前20条文本
      spatialDistribution,
      complexity,
    };
  }

  /**
   * 构建AI分析提示词
   */
  private buildAnalysisPrompt(features: ReturnType<typeof this.extractCanvasFeatures>): string {
    const shapeTypesSummary = Object.entries(features.shapeTypes)
      .map(([type, count]) => `${count}个${type}`)
      .join(', ');

    const textSample =
      features.textContent.length > 0
        ? `\n\n**文本内容样例**（前10条）:\n${features.textContent.slice(0, 10).map((t, i) => `${i + 1}. "${t}"`).join('\n')}`
        : '\n\n画布上暂无文本内容。';

    return `你是一个专业的创作状态分析助手。请分析用户当前在画布上的创作状态,并提供针对性的灵感建议。

## 画布信息

- **图形总数**: ${features.totalShapes}
- **图形类型**: ${shapeTypesSummary || '无'}
- **复杂度**: ${features.complexity}
- **空间分布**: ${features.spatialDistribution}
- **包含文本**: ${features.hasText ? '是' : '否'}
${textSample}

## 创作状态定义

请判断用户处于以下哪种创作状态:

1. **divergent (发散状态)**
   - 特征: 用户正在探索多个方向,尝试不同想法,头脑风暴阶段
   - 表现: 大量不同类型的图形,内容丰富但可能较为分散,文本多为关键词或短句
   - 需求: 需要鼓励继续探索,提供更多角度和可能性

2. **convergent (收敛状态)**
   - 特征: 用户开始整理归纳,聚焦核心内容,结构化思维
   - 表现: 图形之间有明显的逻辑关系,出现层次结构,文本更加完整和系统
   - 需求: 需要帮助深化细节,提供结构化建议,辅助完善方案

3. **stagnant (停滞状态)**
   - 特征: 创作进展缓慢,内容稀少或重复,缺乏新想法
   - 表现: 画布几乎为空,或长时间无明显变化,或内容单调重复
   - 需求: 需要激发灵感,提供破局思路,引导新的思考方向

## 分析要求

1. 综合考虑图形数量、类型分布、文本内容的语义
2. 给出创作状态判断（divergent/convergent/stagnant）和置信度（0-1）
3. 提供3-5个针对性的灵感建议,包括:
   - **question**: 启发性问题,引导思考
   - **idea**: 具体的想法或方向建议
   - **action**: 可执行的下一步行动
   - **resource**: 相关的参考资源或方法论
4. 每个建议需要包含标题和详细内容,并设置优先级(1-5)
5. 给出整体分析摘要（2-3句话）

## 输出格式

请以JSON格式输出:

\`\`\`json
{
  "state": "divergent|convergent|stagnant",
  "confidence": 0.85,
  "description": "当前创作状态的详细描述（50-100字）",
  "suggestions": [
    {
      "type": "question|idea|action|resource",
      "title": "建议标题（10-20字）",
      "content": "建议的详细内容（50-150字）",
      "priority": 4
    }
  ],
  "summary": "整体分析摘要（2-3句话，80-150字）"
}
\`\`\`

注意事项:
- suggestions数组应包含3-5个建议
- 建议要具体、可操作,避免空洞的鼓励
- 根据用户当前画布内容提供个性化建议
- 优先级要合理分配,最重要的建议设为5

现在开始分析:`;
  }

  /**
   * 使用AI模型进行分析
   */
  private async analyzeWithAI(
    prompt: string,
    teamId: string,
    userId: string,
  ): Promise<string> {
    // 获取可用的模型列表
    const models = this.modelRegistry.listModels(teamId);

    if (!models || models.length === 0) {
      throw new Error('No available AI model for creative state analysis');
    }

    // 使用第一个可用模型
    const modelConfig = models[0];
    const model = this.modelRegistry.resolveModel(modelConfig.id);

    this.logger.debug(`Using model ${modelConfig.id} for creative state analysis`);

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
        temperature: 0.4, // 适中的温度,保持创意但不失准确
      });

      return result.text;
    } catch (error) {
      this.logger.error('AI model analysis failed', error.stack);
      throw new Error(`Failed to analyze creative state: ${error.message}`);
    }
  }

  /**
   * 解析AI返回的分析结果
   */
  private parseAnalysisResult(aiResponse: string): CreativeStateAnalysisResult {
    try {
      // 提取JSON部分
      let jsonStr = aiResponse.trim();

      // 去除markdown代码块标记
      const jsonMatch = jsonStr.match(/```json\s*\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      } else {
        // 尝试找到纯JSON内容
        const jsonStart = jsonStr.indexOf('{');
        const jsonEnd = jsonStr.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
        }
      }

      const parsed = JSON.parse(jsonStr);

      // 验证并规范化结果
      const state = this.validateCreativeState(parsed.state);
      const confidence = Math.max(0, Math.min(1, parsed.confidence || 0.7));
      const description = parsed.description || 'No description provided';
      const summary = parsed.summary || 'Analysis completed';

      // 验证和规范化建议
      const suggestions: InspirationSuggestion[] = [];
      if (Array.isArray(parsed.suggestions)) {
        for (const sug of parsed.suggestions) {
          if (sug.title && sug.content) {
            suggestions.push({
              type: this.validateSuggestionType(sug.type),
              title: sug.title.substring(0, 100),
              content: sug.content.substring(0, 500),
              priority: Math.max(1, Math.min(5, sug.priority || 3)),
            });
          }
        }
      }

      // 如果没有建议,提供默认建议
      if (suggestions.length === 0) {
        suggestions.push(this.getDefaultSuggestion(state));
      }

      // 按优先级排序
      suggestions.sort((a, b) => b.priority - a.priority);

      return {
        state,
        confidence,
        description,
        suggestions,
        summary,
        processingTime: 0, // 将在外层设置
      };
    } catch (error) {
      this.logger.error('Failed to parse analysis result', error.stack);
      this.logger.debug('Raw AI response:', aiResponse);

      // 返回默认结果
      return {
        state: CreativeState.STAGNANT,
        confidence: 0.5,
        description: '分析过程遇到问题,返回默认状态',
        suggestions: [this.getDefaultSuggestion(CreativeState.STAGNANT)],
        summary: '当前画布内容较少,建议开始探索和记录想法。',
        processingTime: 0,
      };
    }
  }

  /**
   * 验证创作状态是否合法
   */
  private validateCreativeState(state: string): CreativeState {
    if (Object.values(CreativeState).includes(state as CreativeState)) {
      return state as CreativeState;
    }
    this.logger.warn(`Invalid creative state: ${state}, defaulting to stagnant`);
    return CreativeState.STAGNANT;
  }

  /**
   * 验证建议类型是否合法
   */
  private validateSuggestionType(
    type: string,
  ): 'question' | 'idea' | 'action' | 'resource' {
    const validTypes = ['question', 'idea', 'action', 'resource'];
    if (validTypes.includes(type)) {
      return type as any;
    }
    this.logger.warn(`Invalid suggestion type: ${type}, defaulting to idea`);
    return 'idea';
  }

  /**
   * 获取默认建议（当AI无法生成时）
   */
  private getDefaultSuggestion(state: CreativeState): InspirationSuggestion {
    const defaultSuggestions: Record<CreativeState, InspirationSuggestion> = {
      [CreativeState.DIVERGENT]: {
        type: 'question',
        title: '尝试更多角度',
        content: '你已经探索了一些想法,不妨从用户视角、技术实现、商业价值等不同维度继续发散思考。',
        priority: 3,
      },
      [CreativeState.CONVERGENT]: {
        type: 'action',
        title: '梳理核心逻辑',
        content: '建议将当前的想法按照优先级排序,识别出最核心的2-3个关键点,然后深入细化。',
        priority: 3,
      },
      [CreativeState.STAGNANT]: {
        type: 'idea',
        title: '从问题出发',
        content: '试着先明确要解决的核心问题是什么,然后围绕这个问题展开思考,记录所有可能的解决方向。',
        priority: 4,
      },
    };

    return defaultSuggestions[state];
  }

  /**
   * 格式化分析结果为适合推送的消息文本
   */
  formatAsMessage(result: CreativeStateAnalysisResult): string {
    const stateEmoji = {
      [CreativeState.DIVERGENT]: '🌟',
      [CreativeState.CONVERGENT]: '🎯',
      [CreativeState.STAGNANT]: '💡',
    };

    const stateText = {
      [CreativeState.DIVERGENT]: '发散状态 (Divergent)',
      [CreativeState.CONVERGENT]: '收敛状态 (Convergent)',
      [CreativeState.STAGNANT]: '停滞状态 (Stagnant)',
    };

    const emoji = stateEmoji[result.state];
    const state = stateText[result.state];

    let message = `${emoji} **当前创作状态: ${state}**\n\n`;
    message += `${result.description}\n\n`;
    message += `---\n\n`;
    message += `**💡 灵感建议**\n\n`;

    for (let i = 0; i < Math.min(result.suggestions.length, 5); i++) {
      const sug = result.suggestions[i];
      const typeEmoji = {
        question: '❓',
        idea: '💭',
        action: '✅',
        resource: '📚',
      };

      message += `${i + 1}. ${typeEmoji[sug.type]} **${sug.title}**\n`;
      message += `   ${sug.content}\n\n`;
    }

    message += `---\n\n`;
    message += `_${result.summary}_`;

    return message;
  }
}
