import { config } from '@/common/config';
import { Injectable } from '@nestjs/common';
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
}

@Injectable()
export class AgentV3ModelRegistryService {
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
        const client = createOpenAI({
          apiKey,
          baseURL: baseUrl,
        });
        return client(name) as unknown as LanguageModel;
      }
      case 'openai-compatible': {
        const client = createOpenAI({
          apiKey: config.agentv3?.openaiCompatible?.apiKey || process.env.OPENAI_COMPATIBLE_API_KEY,
          baseURL: config.agentv3?.openaiCompatible?.baseUrl || process.env.OPENAI_COMPATIBLE_BASE_URL,
        });
        return client(name) as unknown as LanguageModel;
      }
      case 'anthropic': {
        const client = createAnthropic({
          apiKey: config.agentv3?.anthropic?.apiKey || process.env.ANTHROPIC_API_KEY,
          baseURL: config.agentv3?.anthropic?.baseUrl,
        });
        return client(name) as unknown as LanguageModel;
      }
      case 'google': {
        const client = createGoogleGenerativeAI({
          apiKey: config.agentv3?.google?.apiKey || process.env.GOOGLE_API_KEY,
          baseURL: config.agentv3?.google?.baseUrl,
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
      for (const name of config.agentv3.openai.models) {
        models.push({
          id: `openai:${name}`,
          providerId: 'openai',
          modelName: name,
          supportsImages: true,
        });
      }
    }

    if (config.agentv3?.openaiCompatible?.models) {
      for (const name of config.agentv3.openaiCompatible.models) {
        models.push({
          id: `openai-compatible:${name}`,
          providerId: 'openai-compatible',
          modelName: name,
          supportsImages: true,
        });
      }
    }

    if (config.agentv3?.anthropic?.models) {
      for (const name of config.agentv3.anthropic.models) {
        models.push({
          id: `anthropic:${name}`,
          providerId: 'anthropic',
          modelName: name,
          supportsImages: true,
        });
      }
    }

    if (config.agentv3?.google?.models) {
      for (const name of config.agentv3.google.models) {
        models.push({
          id: `google:${name}`,
          providerId: 'google',
          modelName: name,
          supportsImages: true,
        });
      }
    }

    return models;
  }
}
