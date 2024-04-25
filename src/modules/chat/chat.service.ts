import { LlmModelEndpointType, config } from '@/common/config';
import { logger } from '@/common/logger';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { BlockDefProperties } from '@inf-monkeys/vines';
import { Injectable } from '@nestjs/common';
import { OpenAIStream, StreamData, StreamingTextResponse, ToolCallPayload } from 'ai';
import axios from 'axios';
import { Response } from 'express';
import OpenAI from 'openai';
import { ChatCompletion, ChatCompletionChunk, ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources';
import { Stream } from 'openai/streaming';
import { Readable } from 'stream';
import { ToolsForwardService } from '../tools/tools.forward.service';

export interface CreateChatCompelitionsParams {
  messages: Array<ChatCompletionMessageParam>;
  model: string;
  temperature?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
  max_tokens?: number;
  systemPrompt?: string;
  tools?: string[];
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
export class ChatService {
  constructor(
    private readonly toolsReopsitory: ToolsRepository,
    private readonly toolForwardServie: ToolsForwardService,
  ) {}

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
    const { apiKey, baseURL, defaultParams, promptTemplate } = this.getModelConfig(model);

    const prompt = params.prompt;
    if (promptTemplate) {
      params.prompt = promptTemplate.replace('{question}', prompt);
    }

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

  private resolveToolParameter(input: BlockDefProperties[]): ChatCompletionTool['function']['parameters'] {
    const parameters: ChatCompletionTool['function']['parameters'] = {
      type: 'object',
      properties: {},
    };
    for (const inputItem of input) {
      parameters.properties[inputItem.name] = {
        type: 'string',
        description: inputItem.description || inputItem.displayName,
      };
    }
    return parameters;
  }

  public async resolveTools(tools: string[]): Promise<Array<ChatCompletionTool>> {
    const toolEntities = await this.toolsReopsitory.getToolsByNames(tools);
    return toolEntities.map((x) => {
      const parameters = this.resolveToolParameter(x.input);
      return {
        type: 'function',
        function: {
          name: x.name.replaceAll(':', '__'),
          description: x.description || x.displayName,
          parameters: parameters,
        },
      };
    });
  }

  private async executeTool(name: string, data: any) {
    logger.info(`Start to call tool call: ${name} with arguments: ${JSON.stringify(data)}`);
    name = name.replaceAll('__', ':');
    console.log(name);
    const tool = await this.toolsReopsitory.getToolByName(name);
    const server = await this.toolsReopsitory.getServerByNamespace(tool.namespace);
    const apiInfo = tool.extra?.apiInfo;
    const { method, path } = apiInfo;
    const result = await this.toolForwardServie.request<{ [x: string]: any }>(server.namespace, {
      method,
      url: path,
      data: method.toLowerCase() === 'get' ? undefined : data,
      params: method.toLowerCase() === 'get' ? data : undefined,
    });
    logger.info(`Tool call ${name} result: ${JSON.stringify(result)}`);
    return result;
  }

  public async createChatCompelitions(res: Response, params: CreateChatCompelitionsParams) {
    const { model, stream, systemPrompt } = params;
    let { messages } = params;
    if (systemPrompt) {
      const systemMessage: ChatCompletionMessageParam = {
        role: 'system',
        content: systemPrompt,
      };
      messages = [systemMessage].concat(messages as any);
    }

    const { apiKey, baseURL, defaultParams } = this.getModelConfig(model);
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
      ...defaultParams,
    });
    const tools: Array<ChatCompletionTool> = await this.resolveTools(params.tools);

    let response: ChatCompletion | Stream<ChatCompletionChunk>;
    try {
      response = await openai.chat.completions.create({
        model,
        stream: stream,
        temperature: params.temperature,
        frequency_penalty: params.frequency_penalty,
        presence_penalty: params.presence_penalty,
        max_tokens: params.max_tokens,
        messages,
        tools: tools?.length ? tools : undefined,
        tool_choice: tools?.length ? 'auto' : undefined,
      });
      if (stream) {
        const data = new StreamData();
        const streamResponse = OpenAIStream(response as Stream<ChatCompletionChunk>, {
          experimental_onToolCall: async (call: ToolCallPayload, appendToolCallMessage) => {
            for (const toolCall of call.tools) {
              const result = await this.executeTool(toolCall.func.name, toolCall.func.arguments);
              const newMessages = appendToolCallMessage({
                tool_call_id: toolCall.id,
                function_name: toolCall.func.name,
                tool_call_result: result,
              });
              return openai.chat.completions.create({
                messages: [...messages, ...newMessages] as any,
                model,
                stream: true,
                tools,
                tool_choice: 'auto',
              });
            }
          },
          onCompletion(completion) {
            logger.info(`Completion Finished: ${completion}`);
          },
          onFinal() {
            res.write('data: [DONE]\n\n');
            res.end();
          },
        });
        const streamingTextResponse = new StreamingTextResponse(streamResponse, {}, data);
        // set the content type to text-stream
        res.setHeader('content-type', 'text/event-stream;charset=utf-8');
        res.status(200);
        const body = streamingTextResponse.body;
        const readableStream = Readable.from(body as any);
        const randomChatCmplId = 'chatcmpl-' + Math.random().toString(36).substr(2, 16);
        readableStream.on('data', (chunk) => {
          const decoder = new TextDecoder();
          let chunkString = decoder.decode(chunk);
          chunkString = chunkString.split(':')[chunkString.split(':').length - 1].trimEnd().slice(1, -1);
          const chunkObject = {
            id: randomChatCmplId,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: model,
            system_fingerprint: null,
            choices: [{ index: 0, delta: { content: chunkString }, logprobs: null, finish_reason: null }],
          };
          res.write(`data: ${JSON.stringify(chunkObject, null, 0)}\n\n`);
        });
      } else {
        const data = response as ChatCompletion;
        if (data.choices[0].message.tool_calls) {
          let newMessages: Array<ChatCompletionMessageParam> = [];
          const toolCalls = data.choices[0].message.tool_calls;
          for (const toolCall of toolCalls) {
            const {
              function: { name, arguments: argumentsData },
            } = toolCall;
            const toolResult = await this.executeTool(name, argumentsData);
            newMessages = newMessages.concat([
              {
                role: 'assistant',
                content: '',
                tool_calls: data.choices[0].message.tool_calls,
              },
              {
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(toolResult),
              },
            ]);
          }

          const result = await openai.chat.completions.create({
            messages: [...messages, ...newMessages] as any,
            model,
            stream: false,
            tools,
            tool_choice: 'auto',
          });
          return res.status(200).send(result);
        } else {
          return res.status(200).send(response);
        }
      }
    } catch (error) {
      return res.status(500).send(error.message);
    }
  }
}
