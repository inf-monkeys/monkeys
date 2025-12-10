import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ToolsEntity } from '@/database/entities/tools/tools.entity';

/**
 * 场景到Category映射表
 * 用于精准筛选工具
 */
const SCENARIO_CATEGORY_MAP: Record<string, string[]> = {
  'text-to-image': ['gen-image'],
  'image-to-image': ['gen-image', 'image-edit'],
  'video-generation': ['gen-video'],
  'image-analysis': ['ai-analysis', 'vision'],
  'text-generation': ['text-generation', 'ai-chat'],
  'audio-generation': ['gen-audio', 'tts'],
  'image-processing': ['image-edit', 'media'],
};

/**
 * 简化的工具信息（给AI使用）
 */
export interface SimplifiedToolInfo {
  namespace: string;
  name: string;
  displayName: string | Record<string, string>;
  description?: string | Record<string, string>;
  categories?: string[];
  input: {
    name: string;
    displayName?: string | Record<string, string>;
    type: string;
    required?: boolean;
    description?: string | Record<string, string>;
    options?: Array<{ name: string; value: any }>;
    default?: any;
  }[];
  output: {
    name: string;
    displayName?: string | Record<string, string>;
    type: string;
  }[];
}

/**
 * 工具目录服务
 * 负责获取所有可用工具并格式化为AI可读的格式
 */
@Injectable()
export class ToolsCatalogService {
  constructor(
    @InjectRepository(ToolsEntity)
    private readonly toolsRepository: Repository<ToolsEntity>,
  ) {}

  /**
   * 获取团队可用的所有工具（AI可读格式）
   */
  async getAllToolsForAI(teamId: string): Promise<SimplifiedToolInfo[]> {
    // 查询团队可用的工具：团队私有 + 公共工具
    const tools = await this.toolsRepository.find({
      where: [
        { teamId }, // 团队私有工具
        { public: true }, // 公共工具
      ],
      select: ['namespace', 'name', 'displayName', 'description', 'input', 'output', 'type', 'categories'],
    });

    // 转换为简化格式
    return tools.map((tool) => this.simplifyToolInfo(tool));
  }

  /**
   * 根据命名空间和分类筛选工具
   */
  async getToolsByCategory(
    teamId: string,
    options?: {
      namespaces?: string[];
      categories?: string[];
    },
  ): Promise<SimplifiedToolInfo[]> {
    const queryBuilder = this.toolsRepository.createQueryBuilder('tool').where('(tool.teamId = :teamId OR tool.public = :public)', {
      teamId,
      public: true,
    });

    // 筛选命名空间
    if (options?.namespaces && options.namespaces.length > 0) {
      queryBuilder.andWhere('tool.namespace IN (:...namespaces)', {
        namespaces: options.namespaces,
      });
    }

    // 筛选分类
    if (options?.categories && options.categories.length > 0) {
      queryBuilder.andWhere('tool.categories && :categories', {
        categories: options.categories,
      });
    }

    const tools = await queryBuilder.getMany();
    return tools.map((tool) => this.simplifyToolInfo(tool));
  }

  /**
   * 简化工具信息
   */
  private simplifyToolInfo(tool: ToolsEntity): SimplifiedToolInfo {
    return {
      namespace: tool.namespace,
      name: tool.name,
      displayName: tool.displayName,
      description: tool.description,
      categories: tool.categories,
      input: (tool.input || []).map((param) => ({
        name: param.name,
        displayName: param.displayName,
        type: param.type,
        required: param.required,
        description: param.description,
        options: param.options
          ? Array.isArray(param.options)
            ? param.options.map((opt: any) => ({
                name: opt.name || opt.displayName || String(opt.value),
                value: opt.value,
              }))
            : []
          : undefined,
        default: param.default,
      })),
      output: (tool.output || []).map((param) => ({
        name: param.name,
        displayName: param.displayName,
        type: param.type,
      })),
    };
  }

  /**
   * 获取工具的全限定名称
   */
  getToolFullName(tool: SimplifiedToolInfo): string {
    // 如果 name 已经包含了 namespace 前缀（格式：namespace:name），直接返回
    if (tool.name.includes(':')) {
      return tool.name;
    }
    // 否则拼接 namespace
    return `${tool.namespace}:${tool.name}`;
  }

  /**
   * 格式化工具信息为易读的文本（用于提示词）
   */
  formatToolForPrompt(tool: SimplifiedToolInfo): string {
    const displayName = typeof tool.displayName === 'string' ? tool.displayName : tool.displayName?.['zh-CN'] || tool.displayName?.['en-US'] || tool.name;

    const description = typeof tool.description === 'string' ? tool.description : tool.description?.['zh-CN'] || tool.description?.['en-US'] || '';

    const inputs = tool.input
      .map((param) => {
        const paramDisplayName = typeof param.displayName === 'string' ? param.displayName : param.displayName?.['zh-CN'] || param.displayName?.['en-US'] || param.name;

        const paramDesc = typeof param.description === 'string' ? param.description : param.description?.['zh-CN'] || param.description?.['en-US'] || '';

        let paramInfo = `    - ${param.name} (${param.type})`;
        if (param.required) paramInfo += ' [必填]';
        if (paramDisplayName !== param.name) paramInfo += `: ${paramDisplayName}`;
        if (paramDesc) paramInfo += ` - ${paramDesc}`;
        if (param.default !== undefined) paramInfo += ` (默认: ${JSON.stringify(param.default)})`;
        if (param.options && param.options.length > 0) {
          paramInfo += `\n      可选值: ${param.options.map((opt) => opt.value).join(', ')}`;
        }
        return paramInfo;
      })
      .join('\n');

    const outputs = tool.output
      .map((param) => {
        const paramDisplayName = typeof param.displayName === 'string' ? param.displayName : param.displayName?.['zh-CN'] || param.displayName?.['en-US'] || param.name;
        return `    - ${param.name} (${param.type}): ${paramDisplayName}`;
      })
      .join('\n');

    return `
### ${this.getToolFullName(tool)}
**名称**: ${displayName}
**描述**: ${description}
**输入参数**:
${inputs || '    无'}
**输出**:
${outputs || '    无'}
`.trim();
  }

  /**
   * 格式化工具信息为简洁格式（用于减少 token 使用）
   * 只包含最核心的信息：工具名称、简短描述、必填参数和输出字段
   */
  formatToolForPromptConcise(tool: SimplifiedToolInfo): string {
    const displayName = typeof tool.displayName === 'string' ? tool.displayName : tool.displayName?.['zh-CN'] || tool.displayName?.['en-US'] || tool.name;

    const description = typeof tool.description === 'string' ? tool.description : tool.description?.['zh-CN'] || tool.description?.['en-US'] || '';

    // 只列出必填的输入参数名称
    const requiredInputs = tool.input
      .filter((param) => param.required)
      .map((param) => param.name)
      .join(', ');

    // 只列出输出字段名
    const outputs = tool.output.map((param) => param.name).join(', ');

    return `- ${this.getToolFullName(tool)}: ${displayName || description || ''} (输入:${requiredInputs || '无'} | 输出:${outputs || '无'})`;
  }

  /**
   * 根据用户描述智能筛选相关工具
   * 使用场景检测和category筛选
   */
  filterRelevantTools(tools: SimplifiedToolInfo[], userDescription: string): SimplifiedToolInfo[] {
    // 1. 检测场景
    const scenario = this.detectScenario(userDescription);

    // 2. 如果识别到场景，使用category精准筛选
    if (scenario && SCENARIO_CATEGORY_MAP[scenario]) {
      const targetCategories = SCENARIO_CATEGORY_MAP[scenario];
      const categoryFilteredTools = tools.filter((tool) => tool.categories?.some((cat) => targetCategories.includes(cat)));

      if (categoryFilteredTools.length >= 10) {
        // 按关键词相关性排序
        return this.sortByKeywordRelevance(categoryFilteredTools, userDescription).slice(0, 50);
      }
    }

    // 3. 降级到原有的关键词筛选
    const keywords = this.extractKeywords(userDescription);

    if (keywords.length === 0) {
      return tools.slice(0, 100);
    }

    const scoredTools = tools.map((tool) => {
      let score = 0;
      const toolText = this.getToolSearchText(tool).toLowerCase();

      keywords.forEach((keyword) => {
        if (toolText.includes(keyword)) {
          score += 1;
        }
      });

      return { tool, score };
    });

    const filtered = scoredTools
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 100)
      .map((item) => item.tool);

    if (filtered.length < 20) {
      const remaining = tools.filter((t) => !filtered.includes(t)).slice(0, 80);
      return [...filtered, ...remaining];
    }

    return filtered.length > 0 ? filtered : tools.slice(0, 100);
  }

  /**
   * 检测用户描述中的场景
   */
  private detectScenario(description: string): string | null {
    const lowerDesc = description.toLowerCase();

    // 文生图
    if (/文生图|text.*to.*image|t2i|文本.*生成.*图|文字.*生成.*图/i.test(lowerDesc)) {
      return 'text-to-image';
    }

    // 图生图
    if (/图生图|image.*to.*image|i2i|图片.*编辑|图像.*编辑/i.test(lowerDesc)) {
      return 'image-to-image';
    }

    // 视频生成
    if (/视频|video|文生视频|图生视频/i.test(lowerDesc)) {
      return 'video-generation';
    }

    // 图像分析
    if (/图像.*分析|图片.*分析|vision|识别|理解.*图/i.test(lowerDesc)) {
      return 'image-analysis';
    }

    // 文本生成
    if (/文本生成|text.*generation|写作|chat|对话/i.test(lowerDesc)) {
      return 'text-generation';
    }

    // 音频生成
    if (/音频|audio|tts|语音|声音/i.test(lowerDesc)) {
      return 'audio-generation';
    }

    return null;
  }

  /**
   * 按关键词相关性排序
   */
  private sortByKeywordRelevance(tools: SimplifiedToolInfo[], userDescription: string): SimplifiedToolInfo[] {
    const keywords = this.extractKeywords(userDescription);

    const scoredTools = tools.map((tool) => {
      let score = 0;
      const toolText = this.getToolSearchText(tool).toLowerCase();

      keywords.forEach((keyword) => {
        if (toolText.includes(keyword)) {
          score += 1;
        }
      });

      // 额外加分：如果工具名包含关键词
      const toolName = `${tool.namespace}:${tool.name}`.toLowerCase();
      keywords.forEach((keyword) => {
        if (toolName.includes(keyword)) {
          score += 2; // 工具名匹配权重更高
        }
      });

      return { tool, score };
    });

    return scoredTools.sort((a, b) => b.score - a.score).map((item) => item.tool);
  }

  /**
   * 从用户描述中提取关键词
   */
  private extractKeywords(description: string): string[] {
    const keywords: string[] = [];
    const lowerDesc = description.toLowerCase();

    // 图片相关
    if (/图|image|img|photo|picture/.test(lowerDesc)) {
      keywords.push('image', '图', 'img');
    }
    // 文生图
    if (/文生图|text.*to.*image|t2i/.test(lowerDesc)) {
      keywords.push('generate', 'create', '生成');
    }
    // 图生图
    if (/图生图|image.*to.*image|i2i/.test(lowerDesc)) {
      keywords.push('image', 'edit', '编辑');
    }
    // AI/模型
    if (/ai|gpt|gemini|llm|模型/.test(lowerDesc)) {
      keywords.push('ai', 'llm', 'gpt', 'gemini');
    }
    // 视频
    if (/视频|video/.test(lowerDesc)) {
      keywords.push('video', '视频');
    }
    // 音频
    if (/音频|audio|sound|语音/.test(lowerDesc)) {
      keywords.push('audio', '音频', 'sound');
    }
    // 文本处理
    if (/文本|text|翻译|translate/.test(lowerDesc)) {
      keywords.push('text', '文本', 'translate');
    }
    // HTTP
    if (/http|api|请求|下载|upload/.test(lowerDesc)) {
      keywords.push('http', 'api', 'request');
    }
    // 数据库
    if (/数据库|database|sql/.test(lowerDesc)) {
      keywords.push('database', 'sql', '数据库');
    }

    return [...new Set(keywords)]; // 去重
  }

  /**
   * 获取工具的搜索文本（用于关键词匹配）
   */
  private getToolSearchText(tool: SimplifiedToolInfo): string {
    const displayName = typeof tool.displayName === 'string' ? tool.displayName : JSON.stringify(tool.displayName);

    const description = typeof tool.description === 'string' ? tool.description : JSON.stringify(tool.description);

    return `${tool.namespace} ${tool.name} ${displayName} ${description}`;
  }

  /**
   * 提取I18n值（优先中文）
   */
  private extractI18nValue(value: string | Record<string, string> | undefined): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value['zh-CN'] || value['en-US'] || '';
  }

  /**
   * 格式化工具信息为详细格式（用于LLM理解）
   * 展开JSON类型参数的内部结构
   */
  formatToolForPromptDetailed(tool: SimplifiedToolInfo): string {
    const fullName = this.getToolFullName(tool);
    const displayName = this.extractI18nValue(tool.displayName);
    const description = this.extractI18nValue(tool.description);

    // 格式化输入参数（递归展开）
    const inputsFormatted = tool.input.map((param) => this.formatParameterDetailed(param, 0)).join('\n');

    // 格式化输出参数
    const outputsFormatted = tool.output
      .map((param) => {
        const paramDisplayName = this.extractI18nValue(param.displayName);
        return `    - ${param.name} (${param.type}): ${paramDisplayName}`;
      })
      .join('\n');

    // 生成使用示例
    const usageExample = this.generateUsageExample(tool);

    return `
### ${fullName}
**名称**: ${displayName}
**描述**: ${description}
**输入参数**:
${inputsFormatted || '    无'}
**输出**:
${outputsFormatted || '    无'}
**使用示例**:
\`\`\`json
${usageExample}
\`\`\`
`.trim();
  }

  /**
   * 递归格式化参数（展开JSON类型）
   */
  private formatParameterDetailed(param: any, indentLevel: number): string {
    const indent = '  '.repeat(indentLevel + 2);
    const paramDisplayName = this.extractI18nValue(param.displayName);
    const paramDesc = this.extractI18nValue(param.description);

    let result = `${indent}- ${param.name} (${param.type})`;
    if (param.required) result += ' [必填]';
    if (paramDisplayName && paramDisplayName !== param.name) {
      result += `: ${paramDisplayName}`;
    }

    if (paramDesc) {
      result += `\n${indent}  说明: ${paramDesc}`;
    }

    if (param.default !== undefined && param.default !== null) {
      result += `\n${indent}  默认值: ${JSON.stringify(param.default).substring(0, 100)}`;
    }

    // 展开JSON类型参数的内部结构
    if (param.type === 'json' && param.default && typeof param.default === 'object') {
      result += `\n${indent}  内部结构:`;
      for (const [key, value] of Object.entries(param.default)) {
        const valueType = typeof value;
        result += `\n${indent}    - ${key} (${valueType})`;
        if (value !== '' && value !== null) {
          result += `: ${JSON.stringify(value)}`;
        }
      }
    }

    // 如果有options，列出
    if (param.options && param.options.length > 0) {
      const optionValues = param.options.map((opt: any) => opt.value).join(', ');
      result += `\n${indent}  可选值: ${optionValues}`;
    }

    return result;
  }

  /**
   * 生成工具使用示例
   */
  private generateUsageExample(tool: SimplifiedToolInfo): string {
    const fullName = this.getToolFullName(tool);

    // 检查是否有input包装器参数
    const inputWrapperParam = tool.input.find((p) => p.name === 'input' && p.type === 'json');

    const exampleParams: Record<string, any> = {};

    if (inputWrapperParam) {
      // 需要嵌套在input对象内
      const inputDefault = inputWrapperParam.default || {};
      exampleParams.input = {};

      // 从default中提取示例值
      for (const [key, value] of Object.entries(inputDefault)) {
        if (key === 'prompt' || key.includes('prompt')) {
          exampleParams.input[key] = '${workflow.input.prompt}';
        } else if (typeof value === 'string' && value !== '') {
          exampleParams.input[key] = value;
        } else if (typeof value === 'number') {
          exampleParams.input[key] = value;
        } else {
          exampleParams.input[key] = value;
        }
      }
    } else {
      // 直接平铺参数
      tool.input.forEach((param) => {
        if (param.name === 'prompt' || param.name.includes('prompt')) {
          exampleParams[param.name] = '${workflow.input.prompt}';
        } else if (param.default !== undefined) {
          exampleParams[param.name] = param.default;
        }
      });
    }

    return JSON.stringify(
      {
        name: fullName,
        taskReferenceName: 'task_ref',
        type: 'SIMPLE',
        inputParameters: exampleParams,
      },
      null,
      2,
    );
  }
}
