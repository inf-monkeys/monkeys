import { Injectable, Logger } from '@nestjs/common';
import { LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { config } from '@/common/config';

export interface ModelConfig {
  id: string; // "openai:gpt-4"
  providerId: 'openai' | 'anthropic' | 'google' | 'openai-compatible';
  modelName: string;
  displayName?: string;
  supportsImages?: boolean;
  supportsTools?: boolean;
  maxTokens?: number;
}

/**
 * 模型注册服务
 *
 * **职责**：
 * - 解析模型 ID（格式: "provider:model-name"）
 * - 创建并返回 LanguageModel 实例
 * - 管理可用模型列表
 * - 支持多个 provider（OpenAI, Anthropic, Google, OpenAI-compatible）
 */
@Injectable()
export class ModelRegistryService {
  private readonly logger = new Logger(ModelRegistryService.name);

  /**
   * 解析模型 ID 并创建 LanguageModel 实例
   *
   * @param modelId 格式: "provider:model-name"，例如 "openai:gpt-4"
   * @returns LanguageModel 实例
   */
  resolveModel(modelId: string): LanguageModel {
    const [provider, ...rest] = modelId.split(':');
    const modelName = rest.join(':'); // 处理模型名中可能包含的 ':'

    this.logger.debug(`Resolving model: ${modelId} (provider=${provider}, model=${modelName})`);

    try {
      switch (provider) {
        case 'openai':
        case 'openai-compatible':
          return this.createOpenAICompatibleModel(modelName);

        case 'anthropic':
          return this.createAnthropicModel(modelName);

        case 'google':
          return this.createGoogleModel(modelName);

        default:
          throw new Error(`Unsupported model provider: ${provider}`);
      }
    } catch (error) {
      this.logger.error(`Failed to resolve model ${modelId}:`, error);
      throw error;
    }
  }

  /**
   * 获取团队可用的模型列表
   *
   * @param teamId 团队 ID
   * @returns 模型配置列表
   */
  listModels(teamId?: string): ModelConfig[] {
    const models: ModelConfig[] = [];

    // OpenAI 模型
    if (config.agent?.openai?.apiKey) {
      const configuredModels = config.agent.openai.models || [];
      for (const modelName of configuredModels) {
        models.push({
          id: `openai:${modelName}`,
          providerId: 'openai',
          modelName,
          displayName: modelName,
          supportsImages: modelName.includes('gpt') || modelName.includes('vision'),
          supportsTools: true,
          maxTokens: 128000,
        });
      }
    }

    // Anthropic 模型
    if (config.agent?.anthropic?.apiKey) {
      const configuredModels = config.agent.anthropic.models || [];
      for (const modelName of configuredModels) {
        models.push({
          id: `anthropic:${modelName}`,
          providerId: 'anthropic',
          modelName,
          displayName: modelName,
          supportsImages: modelName.includes('claude'),
          supportsTools: true,
          maxTokens: 200000,
        });
      }
    }

    // Google 模型
    if (config.agent?.google?.apiKey) {
      const configuredModels = config.agent.google.models || [];
      for (const modelName of configuredModels) {
        models.push({
          id: `google:${modelName}`,
          providerId: 'google',
          modelName,
          displayName: modelName,
          supportsImages: modelName.includes('gemini'),
          supportsTools: true,
          maxTokens: 128000,
        });
      }
    }

    return models;
  }

  /**
   * 创建 OpenAI 模型实例
   */
  private createOpenAICompatibleModel(modelName: string): LanguageModel {
    const openai = createOpenAI({
      apiKey: config.agent?.openai?.apiKey || '',
      baseURL: config.agent?.openai?.baseUrl || 'https://api.openai.com/v1',
    });
    return openai(modelName) as LanguageModel;
  }

  /**
   * 创建 Anthropic 模型实例
   */
  private createAnthropicModel(modelName: string): LanguageModel {
    const anthropic = createAnthropic({
      apiKey: config.agent?.anthropic?.apiKey || '',
      baseURL: config.agent?.anthropic?.baseUrl || 'https://api.anthropic.com',
    });
    return anthropic(modelName) as LanguageModel;
  }

  /**
   * 创建 Google 模型实例
   */
  private createGoogleModel(modelName: string): LanguageModel {
    const google = createGoogleGenerativeAI({
      apiKey: config.agent?.google?.apiKey || '',
      baseURL: config.agent?.google?.baseUrl,
    });
    return google(modelName) as LanguageModel;
  }
}
