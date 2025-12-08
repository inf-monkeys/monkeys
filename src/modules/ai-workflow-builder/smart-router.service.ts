import { Injectable, Logger } from '@nestjs/common';
import { WorkflowTemplate } from './templates/template.interface';
import { WORKFLOW_TEMPLATES, findMatchingTemplate } from './templates/scenario-templates';
import { ToolsCatalogService } from './tools-catalog.service';
import { WorkflowCrudService } from '../workflow/workflow.curd.service';

/**
 * 模板匹配结果
 */
export interface TemplateMatchResult {
  template: WorkflowTemplate;
  confidence: number; // 0-1，匹配置信度
  matchedKeywords: string[]; // 匹配到的关键词
}

/**
 * 智能路由服务
 * 负责决定使用模板还是AI生成工作流
 */
@Injectable()
export class SmartRouterService {
  private readonly logger = new Logger(SmartRouterService.name);

  constructor(
    private readonly toolsCatalogService: ToolsCatalogService,
    private readonly workflowCurdService: WorkflowCrudService,
  ) {}

  /**
   * 路由决策：决定使用模板还是AI生成
   * @param description 用户描述
   * @returns 'template' | 'ai'
   */
  async route(description: string): Promise<'template' | 'ai'> {
    const templateMatch = await this.findBestTemplateMatch(description);

    if (templateMatch && templateMatch.confidence > 0.8) {
      this.logger.log(`高置信度模板匹配: ${templateMatch.template.scenario} (${(templateMatch.confidence * 100).toFixed(0)}%)`);
      return 'template';
    }

    if (templateMatch && templateMatch.confidence > 0.5) {
      // 中等置信度，检查是否为简单变体
      const isSimpleVariation = this.isSimpleVariation(description, templateMatch.template);
      if (isSimpleVariation) {
        this.logger.log(`简单变体模板匹配: ${templateMatch.template.scenario} (${(templateMatch.confidence * 100).toFixed(0)}%)`);
        return 'template';
      }
    }

    this.logger.log('未找到合适模板，降级到AI生成');
    return 'ai';
  }

  /**
   * 查找最佳模板匹配
   * @param description 用户描述
   * @returns 模板匹配结果或null
   */
  async findBestTemplateMatch(description: string): Promise<TemplateMatchResult | null> {
    const lowerDesc = description.toLowerCase();

    // 使用现有的模板匹配函数
    const existingMatch = findMatchingTemplate(description);
    if (existingMatch) {
      // 计算详细的匹配分数
      const result = this.calculateMatchScore(lowerDesc, existingMatch);
      this.logger.debug(`模板 ${existingMatch.scenario} 匹配分数: ${(result.confidence * 100).toFixed(0)}%`);
      return result;
    }

    // 降级：遍历所有模板计算分数
    const allMatches: TemplateMatchResult[] = [];

    for (const template of WORKFLOW_TEMPLATES) {
      const result = this.calculateMatchScore(lowerDesc, template);
      if (result.confidence > 0.3) {
        // 至少30%相关性才考虑
        allMatches.push(result);
      }
    }

    if (allMatches.length === 0) {
      return null;
    }

    // 返回分数最高的模板
    allMatches.sort((a, b) => b.confidence - a.confidence);
    const best = allMatches[0];

    this.logger.debug(`最佳模板: ${best.template.scenario}, 置信度: ${(best.confidence * 100).toFixed(0)}%`);

    return best;
  }

  /**
   * 计算模板匹配分数
   * @param lowerDesc 小写的用户描述
   * @param template 工作流模板
   * @returns 匹配结果
   */
  private calculateMatchScore(lowerDesc: string, template: WorkflowTemplate): TemplateMatchResult {
    let score = 0;
    const matchedKeywords: string[] = [];

    // 1. 关键词匹配（权重50%）
    for (const keyword of template.keywords) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        score += 50 / template.keywords.length;
        matchedKeywords.push(keyword);
      }
    }

    // 2. 工具名称匹配（权重30%）
    for (const toolName of template.requiredTools) {
      const toolShortName = toolName.split(':')[1] || toolName;
      if (lowerDesc.includes(toolShortName.toLowerCase())) {
        score += 30 / template.requiredTools.length;
      }
    }

    // 3. 场景标识匹配（权重20%）
    if (lowerDesc.includes(template.scenario.toLowerCase())) {
      score += 20;
    }

    return {
      template,
      confidence: Math.min(score / 100, 1), // 归一化到0-1
      matchedKeywords,
    };
  }

  /**
   * 检查是否为简单变体（只是参数不同）
   * @param description 用户描述
   * @param template 模板
   * @returns 是否为简单变体
   */
  private isSimpleVariation(description: string, template: WorkflowTemplate): boolean {
    // 简单策略：如果关键词匹配超过60%，认为是变体
    const lowerDesc = description.toLowerCase();
    const matchedCount = template.keywords.filter(k => lowerDesc.includes(k.toLowerCase())).length;
    const matchRatio = matchedCount / template.keywords.length;

    return matchRatio > 0.6;
  }

  /**
   * 从模板生成工作流
   * @param template 工作流模板
   * @param description 用户描述（用于提取参数）
   * @param name 工作流名称
   * @param teamId 团队ID
   * @param userId 用户ID
   * @returns 创建的工作流ID
   */
  async generateFromTemplate(
    template: WorkflowTemplate,
    description: string,
    name: string,
    teamId: string,
    userId: string,
  ): Promise<{ workflowId: string; displayName: any }> {
    this.logger.log(`使用模板 ${template.scenario} 生成工作流: ${name}`);

    // 复制模板的工作流示例
    const workflowDef = {
      ...template.workflowExample,
      // 可以根据description进一步定制（未来优化）
      // 例如：提取用户描述中的特定参数值
    };

    // 创建工作流
    const workflowId = await this.workflowCurdService.createWorkflowDef(teamId, userId, workflowDef);

    this.logger.log(`✅ 模板工作流创建成功: ${workflowId}`);

    return {
      workflowId,
      displayName: workflowDef.displayName,
    };
  }

  /**
   * 预览模板匹配（用于前端展示）
   * @param description 用户描述
   * @returns 匹配结果
   */
  async previewTemplateMatch(description: string): Promise<{
    matched: boolean;
    template?: WorkflowTemplate;
    confidence?: number;
    fallbackToAI: boolean;
  }> {
    const matchResult = await this.findBestTemplateMatch(description);

    if (matchResult && matchResult.confidence > 0.8) {
      return {
        matched: true,
        template: matchResult.template,
        confidence: matchResult.confidence,
        fallbackToAI: false,
      };
    }

    return {
      matched: false,
      fallbackToAI: true,
    };
  }
}
