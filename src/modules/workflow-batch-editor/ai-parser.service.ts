import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../tools/llm/llm.service';
import { BatchEditOperationType, ParsedEditPlan } from './dto/ai-assisted-edit.dto';
import { config } from '@/common/config';

/**
 * AI 解析服务
 * 负责将自然语言编辑需求解析为结构化的操作计划
 */
@Injectable()
export class AiParserService {
  private readonly logger = new Logger(AiParserService.name);

  constructor(
    private readonly llmService: LlmService,
  ) {}

  /**
   * 解析自然语言批量编辑请求
   */
  async parseNaturalLanguageRequest(
    request: string,
    teamId: string,
  ): Promise<{
    parsedPlan: ParsedEditPlan;
    rawResponse: string;
  }> {
    this.logger.log(`解析自然语言编辑请求: ${request}`);

    // TODO: 如果需要工具列表,可以从 ToolsService 获取
    // 目前暂时使用空列表
    const toolsList = '(工具列表功能待完善)';

    // 构建系统提示词
    const systemPrompt = this.buildSystemPrompt(toolsList);

    // 构建用户提示词
    const userPrompt = this.buildUserPrompt(request);

    // 调用 LLM
    this.logger.log('调用 LLM 解析编辑请求...');
    const llmResponse = await this.callLLM(systemPrompt, userPrompt);

    // 解析 LLM 响应
    const parsedPlan = this.extractPlanFromResponse(llmResponse);

    this.logger.log(`解析完成: 操作类型=${parsedPlan.operationType}, 置信度=${parsedPlan.confidence}`);

    return {
      parsedPlan,
      rawResponse: llmResponse,
    };
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(toolsList: string): string {
    return `你是一个工作流批量编辑助手。用户会用自然语言描述批量修改需求，你需要将其解析成结构化的操作计划。

## 可用的操作类型
1. **rename**: 重命名工作流显示名称
2. **update_params**: 修改工作流中任务的参数
3. **replace_tool**: 替换工作流中使用的工具
4. **update_description**: 修改工作流描述
5. **mixed**: 混合多种操作

## 当前团队可用的工具（前50个）
${toolsList}

## 常见的参数名称
- aspect_ratio: 宽高比（如 "1:1", "16:9", "4:3"）
- image_size: 图片分辨率（如 "1024x1024", "1920x1080"）
- num_images: 生成图片数量
- prompt: 提示词
- negative_prompt: 负面提示词
- model: 模型名称
- temperature: 温度参数（0-1）

## 输出格式（必须是有效的 JSON）
你必须输出一个 JSON 对象，格式如下：

\`\`\`json
{
  "operationType": "rename" | "update_params" | "replace_tool" | "update_description" | "mixed",
  "confidence": 0.95,  // 0-1 之间，表示你对解析结果的置信度
  "filter": {
    "displayNamePattern": "...",  // 可选，按名称搜索
    "toolName": "...",             // 可选，按工具名搜索
    "toolNamespace": "...",        // 可选，工具命名空间
    "hasParameter": "..."          // 可选，按参数存在性搜索
  },
  "operations": [
    {
      "type": "rename" | "update_param" | "replace_tool" | "update_description",
      "target": "...",      // 目标字段/参数名
      "oldValue": "...",    // 可选，旧值（用于 replace 类型）
      "newValue": "...",    // 新值
      "mode": "override" | "default" | "merge"  // 可选，对于参数更新
    }
  ],
  "reasoning": "..."  // 简要说明你的推理过程
}
\`\`\`

## 示例

### 示例 1: 批量重命名
用户输入: "把所有名字包含 'upload image' 的工作流改成 'upload model'"
输出:
\`\`\`json
{
  "operationType": "rename",
  "confidence": 0.95,
  "filter": {
    "displayNamePattern": "upload image"
  },
  "operations": [
    {
      "type": "rename",
      "target": "displayName",
      "oldValue": "upload image",
      "newValue": "upload model",
      "mode": "override"
    }
  ],
  "reasoning": "用户想要将所有包含 'upload image' 的工作流名称改为 'upload model'"
}
\`\`\`

### 示例 2: 批量修改参数
用户输入: "把所有 Gemini 生图的 ratio 改成 1:1, 数量改成 2"
输出:
\`\`\`json
{
  "operationType": "update_params",
  "confidence": 0.9,
  "filter": {
    "toolName": "gemini_3_pro_image_generate",
    "toolNamespace": "third_party_api"
  },
  "operations": [
    {
      "type": "update_param",
      "target": "aspect_ratio",
      "newValue": "1:1",
      "mode": "override"
    },
    {
      "type": "update_param",
      "target": "num_images",
      "newValue": 2,
      "mode": "override"
    }
  ],
  "reasoning": "用户想要修改所有使用 Gemini 生图工具的工作流，将宽高比改为 1:1，生成数量改为 2"
}
\`\`\`

### 示例 3: 批量修改多个工具的参数
用户输入: "把所有用 jimeng 生图的工作流，宽高比改成 16:9，分辨率改成 1920x1080"
输出:
\`\`\`json
{
  "operationType": "update_params",
  "confidence": 0.92,
  "filter": {
    "toolName": "jimeng_image_generate",
    "toolNamespace": "third_party_api"
  },
  "operations": [
    {
      "type": "update_param",
      "target": "aspect_ratio",
      "newValue": "16:9",
      "mode": "override"
    },
    {
      "type": "update_param",
      "target": "image_size",
      "newValue": "1920x1080",
      "mode": "override"
    }
  ],
  "reasoning": "用户想要修改所有使用 jimeng 生图工具的工作流参数"
}
\`\`\`

## 重要提示
1. 必须输出有效的 JSON 格式
2. 不要包含任何注释或额外的文本
3. 如果无法确定某个字段，使用 null
4. confidence 必须是 0-1 之间的数字
5. 如果用户的需求不明确，降低 confidence 值并在 reasoning 中说明`;
  }

  /**
   * 构建用户提示词
   */
  private buildUserPrompt(request: string): string {
    return `用户的批量编辑需求:
${request}

请解析用户需求，输出 JSON 格式的操作计划。`;
  }

  /**
   * 调用 LLM
   * 注意: 临时实现,需要后续完善 LLM 调用方式
   */
  private async callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
    // 使用 agentv3 默认模型或固定模型
    const model = config.agentv3?.defaultModelId || 'claude-sonnet-4-5-20250929';

    // TODO: 完善 LLM 调用
    // 当前 LlmService.createChatCompelitions 需要 Response 对象
    // 需要调整为适合批量编辑场景的调用方式
    this.logger.warn('AI 解析功能待完善,使用简化版实现');

    // 返回一个基本的 JSON 结构供测试
    return JSON.stringify({
      operationType: 'update_params',
      confidence: 0.5,
      filter: {},
      operations: [],
      reasoning: 'AI 解析功能待完善'
    });
  }

  /**
   * 从 LLM 响应中提取结构化计划
   */
  private extractPlanFromResponse(response: string): ParsedEditPlan {
    try {
      // 尝试解析 JSON
      let jsonText = response.trim();

      // 移除可能的 markdown 代码块标记
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(jsonText);

      // 验证必需字段
      if (!parsed.operationType) {
        throw new Error('缺少 operationType 字段');
      }

      if (!parsed.operations || !Array.isArray(parsed.operations)) {
        throw new Error('缺少 operations 字段或格式不正确');
      }

      // 补充默认值
      return {
        operationType: parsed.operationType as BatchEditOperationType,
        confidence: parsed.confidence || 0.5,
        filter: parsed.filter || {},
        operations: parsed.operations,
        reasoning: parsed.reasoning,
      };
    } catch (error) {
      this.logger.error(`解析 LLM 响应失败: ${error.message}\n原始响应: ${response}`);
      throw new Error(`无法解析 AI 响应: ${error.message}`);
    }
  }
}
