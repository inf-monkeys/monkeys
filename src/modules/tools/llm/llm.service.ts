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
import { KnowledgeBaseService } from '../../assets/knowledge-base/knowledge-base.service';
import { ToolsForwardService } from '../tools.forward.service';
import { ResponseFormat } from './dto/req/create-chat-compltion.dto';

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
  knowledgeBase?: string;
  response_format?: ResponseFormat;
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

export interface CreateChatCompelitionsResponseOptions {
  apiResponseType: 'simple' | 'full';
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
export class LlmService {
  constructor(
    private readonly toolsReopsitory: ToolsRepository,
    private readonly toolForwardServie: ToolsForwardService,
    private readonly knowledgeBaseService: KnowledgeBaseService,
  ) {}

  private getModelConfig(modelName: string) {
    if (!modelName) {
      throw new Error('Model is required, check your workflow configuration.');
    }

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
      temperature: params.temperature ?? undefined,
      frequency_penalty: params.frequency_penalty ?? undefined,
      presence_penalty: params.presence_penalty ?? undefined,
      stream: stream,
      max_tokens: params.max_tokens ?? undefined,
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

  public async resolveTools(tools: string[] | string): Promise<Array<ChatCompletionTool>> {
    if (typeof tools === 'string') {
      tools = [tools];
    }
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

  private async generateMessages(messages: Array<ChatCompletionMessageParam>, presetPrompt: string, knowledgeBase: string): Promise<Array<ChatCompletionMessageParam>> {
    let systemPrompt = '';
    let knowledgeBaseContext = '';

    if (knowledgeBase) {
      const lastMessage = messages[messages.length - 1];
      const { role, content: lastMessageContent } = lastMessage;
      if (role !== 'user') {
        throw new Error('Last message must be user');
      }
      try {
        const retrieveResult = await this.knowledgeBaseService.retrieveKnowledgeBase(knowledgeBase, lastMessageContent as string);
        if (retrieveResult?.text) {
          logger.info(`Retrieved knowledge base: ${retrieveResult.text}`);
          knowledgeBaseContext = retrieveResult.text;
        } else {
          logger.info(`Not found any knowledge based on question: ${lastMessageContent}`);
        }
      } catch (error) {
        logger.warn(`Failed to retrieve knowledge base: ${error.message}`);
      }
    }

    if (presetPrompt && !knowledgeBaseContext) {
      systemPrompt = presetPrompt;
    } else if (knowledgeBaseContext && !presetPrompt) {
      const basePrompt = `Use the following context as your learned knowledge, inside <context></context> XML tags.
<context>
{{#context#}}
</context>

When answer to user:
- If you don't know, just say that you don't know.
- If you don't know when you are not sure, ask for clarification.
- Avoid mentioning that you obtained the information from the context.
- And answer according to the language of the user's question.\n`;
      systemPrompt = basePrompt.replace('{{#context#}}', knowledgeBaseContext);
    } else if (presetPrompt && knowledgeBaseContext) {
      const basePrompt = `{{#presetPrompt#}}

Use the following context as your learned knowledge, inside <context></context> XML tags.
<context>
{{#context#}}
</context>

When answer to user:
- If you don't know, just say that you don't know.
- If you don't know when you are not sure, ask for clarification.
- Avoid mentioning that you obtained the information from the context.
- And answer according to the language of the user's question.\n`;
      systemPrompt = basePrompt.replace('{{#context#}}', knowledgeBaseContext).replace('{{#presetPrompt#}}', presetPrompt);
    }
    if (!systemPrompt) {
      return messages;
    }
    messages = [
      {
        role: 'system',
        content: systemPrompt,
      } as ChatCompletionMessageParam,
    ].concat(messages as any);
    return messages;
  }

  public async createChatCompelitions(res: Response, params: CreateChatCompelitionsParams, options: CreateChatCompelitionsResponseOptions) {
    const { apiResponseType = 'full' } = options;
    if (apiResponseType === 'simple' && params.stream) {
      throw new Error('Stream is not supported in simple api response type');
    }
    const { model, stream, systemPrompt, knowledgeBase, response_format = ResponseFormat.text } = params;
    let { messages } = params;
    messages = await this.generateMessages(messages, systemPrompt, knowledgeBase);

    const { apiKey, baseURL, defaultParams } = this.getModelConfig(model);
    const openai = new OpenAI({
      apiKey: apiKey || 'mock-apikey',
      baseURL: baseURL,
    });
    const tools: Array<ChatCompletionTool> = await this.resolveTools(params.tools);

    let response: ChatCompletion | Stream<ChatCompletionChunk>;
    try {
      response = await openai.chat.completions.create({
        model,
        stream: stream,
        temperature: params.temperature ?? undefined,
        frequency_penalty: params.frequency_penalty ?? undefined,
        presence_penalty: params.presence_penalty ?? undefined,
        max_tokens: params.max_tokens ?? undefined,
        messages,
        tools: tools?.length ? tools : undefined,
        tool_choice: tools?.length ? 'auto' : undefined,
        // Only pass response_format if it's json_object, in case some llm not spport this feature results in error
        response_format:
          response_format === ResponseFormat.jsonObject
            ? {
                type: response_format,
              }
            : undefined,
        ...defaultParams,
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
          // Original String: 0:"你", contains the beginning 0: and the first and last double quotes
          chunkString = chunkString.slice(2, -1).slice(1, -1);
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
          return res.status(200).send(
            apiResponseType === 'full'
              ? result
              : {
                  messages: result.choices[0].message?.content,
                  usage: result.usage,
                },
          );
        } else {
          return res.status(200).send(
            apiResponseType === 'full'
              ? response
              : {
                  message: (response as ChatCompletion).choices[0].message?.content,
                  usage: (response as ChatCompletion).usage,
                },
          );
        }
      }
    } catch (error) {
      logger.error(`Failed to create chat completions: `, error);
      return res.status(500).send(error.message);
    }
  }
}
