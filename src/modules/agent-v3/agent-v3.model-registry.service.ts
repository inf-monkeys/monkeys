import { config, AgentV3ModelConfig as ConfigModelDef } from '@/common/config';
import { Injectable, Logger } from '@nestjs/common';
import { LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export type AgentV3ProviderId = 'openai' | 'openai-compatible' | 'anthropic' | 'google';

export interface AgentV3ModelConfig {
  id: string; // e.g. "openai:gpt-4o"
  providerId: AgentV3ProviderId;
  modelName: string;
  displayName?: string;
  supportsImages?: boolean;
  supportsReasoning?: boolean;
  apiType?: 'chat'; // 可选：强制使用 chat API，不指定则自动判断
}

@Injectable()
export class AgentV3ModelRegistryService {
  private readonly logger = new Logger(AgentV3ModelRegistryService.name);

  /**
   * 自定义 fetch 函数，仅在错误时记录响应信息
   */
  private createLoggingFetch() {
    return async (url: string, init?: RequestInit) => {
      try {
        const response = await fetch(url, init);

        // 如果是错误响应，记录响应内容
        if (!response.ok) {
          const responseText = await response.text();
          this.logger.error(`[HTTP Response] Status: ${response.status}, URL: ${url}`);
          this.logger.error(`[HTTP Response] Body: ${responseText}`);
          // 创建新的响应对象（因为 body 已被读取）
          return new Response(responseText, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        }

        return response;
      } catch (error) {
        this.logger.error(`[HTTP Request] Error: ${error.message}, URL: ${url}`);
        throw error;
      }
    };
  }

  /**
   * 规范化模型配置：将字符串或对象格式统一转换为对象
   */
  private normalizeModelConfig(model: ConfigModelDef): { name: string; apiType?: 'chat' } {
    if (typeof model === 'string') {
      return { name: model }; // 不指定 apiType，使用自动判断
    }
    return { name: model.name, apiType: model.apiType };
  }

  /**
   * 根据 provider 和模型名称查找模型配置
   */
  private findModelConfig(provider: string, modelName: string): { name: string; apiType?: 'chat' } {
    let models: ConfigModelDef[] = [];

    switch (provider) {
      case 'openai':
        models = (config.agentv3?.openai?.models as ConfigModelDef[]) || [];
        break;
      case 'openai-compatible':
        models = (config.agentv3?.openaiCompatible?.models as ConfigModelDef[]) || [];
        break;
      case 'anthropic':
        models = (config.agentv3?.anthropic?.models as ConfigModelDef[]) || [];
        break;
      case 'google':
        models = (config.agentv3?.google?.models as ConfigModelDef[]) || [];
        break;
    }

    for (const model of models) {
      const normalized = this.normalizeModelConfig(model);
      if (normalized.name === modelName) {
        return normalized;
      }
    }

    // 未找到配置，返回默认值（自动判断）
    return { name: modelName };
  }

  /**
   * 根据 teamId 和 modelId 解析为 AI SDK 的 LanguageModel
   */
  resolveModel(teamId: string, modelId?: string): LanguageModel {
    // 目前先使用全局 agentv3 配置，后续可扩展为按 teamId 覆盖
    // modelId 形如 "openai:gpt-4o" 或 "openai-compatible:o3-mini"
    const defaultModelId = config.agentv3?.defaultModelId as string | undefined;
    const finalModelId = modelId || defaultModelId;
    if (!finalModelId) {
      throw new Error('AgentV3: modelId is required');
    }
    const [provider, name] = finalModelId.split(':');
    if (!name) {
      throw new Error(`AgentV3: invalid modelId "${finalModelId}", expected "provider:model"`);
    }

    switch (provider as AgentV3ProviderId) {
      case 'openai': {
        const apiKey = config.agentv3?.openai?.apiKey || process.env.OPENAI_API_KEY;
        const baseUrl = config.agentv3?.openai?.baseUrl;
        const modelConfig = this.findModelConfig('openai', name);

        const client = createOpenAI({
          apiKey,
          baseURL: baseUrl,
        });

        // 根据配置选择 API 类型
        if (modelConfig.apiType === 'chat') {
          return client.chat(name) as unknown as LanguageModel;
        }
        return client(name) as unknown as LanguageModel; // 默认：自动判断
      }
      case 'openai-compatible': {
        const modelConfig = this.findModelConfig('openai-compatible', name);

        const client = createOpenAI({
          apiKey: config.agentv3?.openaiCompatible?.apiKey || process.env.OPENAI_COMPATIBLE_API_KEY,
          baseURL: config.agentv3?.openaiCompatible?.baseUrl || process.env.OPENAI_COMPATIBLE_BASE_URL,
          fetch: this.createLoggingFetch(),
        });

        // 根据配置选择 API 类型
        if (modelConfig.apiType === 'chat') {
          return client.chat(name) as unknown as LanguageModel;
        }
        return client(name) as unknown as LanguageModel; // 默认：自动判断
      }
      case 'anthropic': {
        const apiKey = config.agentv3?.anthropic?.apiKey || process.env.ANTHROPIC_API_KEY;
        const baseUrl = config.agentv3?.anthropic?.baseUrl;
        const client = createAnthropic({
          apiKey,
          baseURL: baseUrl,
        });
        return client(name) as unknown as LanguageModel;
      }
      case 'google': {
        const apiKey = config.agentv3?.google?.apiKey || process.env.GOOGLE_API_KEY;
        const baseUrl = config.agentv3?.google?.baseUrl;
        const client = createGoogleGenerativeAI({
          apiKey,
          baseURL: baseUrl,
        });
        return client(name) as unknown as LanguageModel;
      }
      default:
        throw new Error(`AgentV3: unsupported provider "${provider}"`);
    }
  }

  /**
   * 返回当前 team 可用模型列表
   * 目前基于 config.agentv3，后续可以按 teamId 动态过滤
   */
  listModels(): AgentV3ModelConfig[] {
    // 简化：根据 config.agentv3 生成列表，如果没有就返回空数组
    const models: AgentV3ModelConfig[] = [];

    if (config.agentv3?.openai?.models) {
      for (const model of config.agentv3.openai.models as ConfigModelDef[]) {
        const normalized = this.normalizeModelConfig(model);
        models.push({
          id: `openai:${normalized.name}`,
          providerId: 'openai',
          modelName: normalized.name,
          supportsImages: true,
          apiType: normalized.apiType,
        });
      }
    }

    if (config.agentv3?.openaiCompatible?.models) {
      for (const model of config.agentv3.openaiCompatible.models as ConfigModelDef[]) {
        const normalized = this.normalizeModelConfig(model);
        models.push({
          id: `openai-compatible:${normalized.name}`,
          providerId: 'openai-compatible',
          modelName: normalized.name,
          supportsImages: true,
          apiType: normalized.apiType,
        });
      }
    }

    if (config.agentv3?.anthropic?.models) {
      for (const model of config.agentv3.anthropic.models as ConfigModelDef[]) {
        const normalized = this.normalizeModelConfig(model);
        models.push({
          id: `anthropic:${normalized.name}`,
          providerId: 'anthropic',
          modelName: normalized.name,
          supportsImages: true,
        });
      }
    }

    if (config.agentv3?.google?.models) {
      for (const model of config.agentv3.google.models as ConfigModelDef[]) {
        const normalized = this.normalizeModelConfig(model);
        models.push({
          id: `google:${normalized.name}`,
          providerId: 'google',
          modelName: normalized.name,
          supportsImages: true,
        });
      }
    }

    return models;
  }
}
