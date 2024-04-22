import { LlmModelEndpointType, config } from '@/common/config';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ChatCompletionRole } from 'openai/resources';

export interface CreateChatCompelitionsParams {
  messages: Array<{
    content: string;
    role: ChatCompletionRole;
  }>;
  model: string;
  temperature?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
  max_tokens?: number;
  systemPrompt?: string;
}

export interface CreateCompelitionsParams {
  prompt: string;
  model: string;
  temperature?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
  max_tokens?: number;
}

export const getModels = (
  type?: LlmModelEndpointType,
): Array<{
  name: string;
  value: string;
  type: LlmModelEndpointType[];
}> => {
  const result: Array<{ name: string; value: string; type: LlmModelEndpointType[] }> = [];
  for (const model of config.models) {
    if (type) {
      if (model.type && !model.type.includes(type)) {
        continue;
      }
    }
    if (typeof model.model === 'string') {
      const splittedModels = model.model.split(',');
      for (const modelValue of splittedModels) {
        result.push({
          name: model.displayName || model.model,
          value: modelValue.trim(),
          type: model.type,
        });
      }
    } else if (Array.isArray(model.model)) {
      for (const modelName of model.model) {
        result.push({
          name: model.displayName || modelName,
          value: modelName.trim(),
          type: model.type,
        });
      }
    }
  }
  return result;
};

@Injectable()
export class LlmChatService {
  private getModelConfig(modelName: string) {
    const model = config.models.find((x) => {
      if (typeof x.model === 'string') {
        const splittedModels = x.model.split(',');
        return splittedModels.includes(modelName);
      } else if (Array.isArray(x.model)) {
        return x.model.includes(modelName);
      }
    });
    if (!model) {
      throw new Error(`Model ${modelName} not exists`);
    }
    return model;
  }

  public async createCompelitions(params: CreateCompelitionsParams) {
    const { model, stream = false } = params;
    const { apiKey, baseURL, defaultParams } = this.getModelConfig(model);
    const reqBody = {
      ...(defaultParams || {}),
      prompt: params.prompt,
      model: model,
      temperature: params.temperature,
      frequency_penalty: params.frequency_penalty,
      presence_penalty: params.presence_penalty,
      stream: stream,
      max_tokens: params.max_tokens,
    };
    const res = await axios.post(`${baseURL}/completions`, reqBody, {
      responseType: stream ? 'stream' : 'json',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return res;
  }

  public async createChatCompelitions(params: CreateChatCompelitionsParams) {
    const { model, stream, systemPrompt, messages } = params;
    if (systemPrompt) {
      params.messages = [
        {
          role: 'system' as ChatCompletionRole,
          content: systemPrompt,
        },
      ].concat(messages);
    }

    const { apiKey, baseURL, defaultParams } = this.getModelConfig(model);
    const reqBody = {
      ...(defaultParams || {}),
      messages: params.messages,
      model: model,
      temperature: params.temperature,
      frequency_penalty: params.frequency_penalty,
      presence_penalty: params.presence_penalty,
      stream: stream,
      max_tokens: params.max_tokens,
    };
    const res = await axios.post(`${baseURL}/chat/completions`, reqBody, {
      responseType: stream ? 'stream' : 'json',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return res;
  }
}
