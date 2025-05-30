import { LlmModelEndpointType, config } from '@/common/config';
import { LogLevel, logger } from '@/common/logger';
import { S3Helpers } from '@/common/s3';
import { maskString, replacerNoEscape } from '@/common/utils';
import { getFileExtensionFromUrl } from '@/common/utils/file';
import { getI18NValue } from '@/common/utils/i18n';
import { LlmModelRepository } from '@/database/repositories/llm-model.repository';
import { OneApiRepository } from '@/database/repositories/oneapi.respository';
import { ToolsRepository } from '@/database/repositories/tools.repository';
import { SQL_KNOWLEDGE_BASE_QUERY_TABLE_TOOL } from '@/modules/assets/consts';
import { SqlKnowledgeBaseService } from '@/modules/assets/sql-knowledge-base/sql-knowledge-base.service';
import { ToolProperty } from '@inf-monkeys/monkeys';
import { Injectable } from '@nestjs/common';
import { OpenAIStream, StreamData, StreamingTextResponse, ToolCallPayload } from 'ai';
import axios from 'axios';
import { Response } from 'express';
import OpenAI from 'openai';
import { ChatCompletion, ChatCompletionChunk, ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources';
import { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions';
import { Stream } from 'openai/streaming';
import { Readable } from 'stream';
import { KnowledgeBaseService } from '../../assets/knowledge-base/knowledge-base.service';
import { ToolsForwardService } from '../tools.forward.service';
import { ResponseFormat } from './dto/req/create-chat-compltion.dto';

// 导入图片内容相关类型
import { calculateMd5FromArrayBuffer, extractMarkdownImageUrls, isMarkdown, replaceMarkdownImageUrls } from '@/common/utils/markdown-image-utils';
import { MediaFileEntity } from '@/database/entities/assets/media/media-file';
import { MediaFileService } from '@/modules/assets/media/media.service';
import { ContentPartDto } from '@/modules/chat/dto/req/create-chat-compltion.dto';

export interface CreateChatCompelitionsParams {
  messages: Array<{
    role: string;
    content: string | Array<ContentPartDto>;
    name?: string;
  }>;
  model: string;
  temperature?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
  max_tokens?: number;
  systemPrompt?: string;
  tools?: string[];
  knowledgeBase?: string;
  sqlKnowledgeBase?: string;
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
  apiResponseType?: 'simple' | 'full';
  showLogs?: boolean;
  onSuccess?: (text: string) => void;
  onFailed?: (error: string) => void;
  userId?: string;
}

const getNameByModelName = (name?: string | string[], modelName?: string, defaultValue?: string) => {
  if (!name) {
    return;
  }

  if (typeof defaultValue === 'undefined' && modelName) {
    defaultValue = modelName;
  }

  if (typeof name === 'string') {
    return name;
  }
  if (Array.isArray(name) && modelName) {
    for (const mapperName of name) {
      const targetModelMapper = mapperName?.split('|');
      if ((targetModelMapper?.[0] ?? '') === modelName) {
        return targetModelMapper?.[1] ?? defaultValue;
      }
    }
    return defaultValue;
  }
  return modelName ?? defaultValue;
};

type BuiltModel = {
  name: string;
  value: string;
  type: LlmModelEndpointType[];
  isDefault?: boolean;
  icon?: string;
  desc?: string;
};

export const getModels = (type?: LlmModelEndpointType): Array<BuiltModel> => {
  const result: Array<BuiltModel> = [];
  for (const model of config.models) {
    if (type) {
      if (model.type && !model.type.includes(type)) {
        continue;
      }
    }
    if (typeof model.model === 'string') {
      const splittedModels = model.model.split(',');
      for (const modelValue of splittedModels) {
        const finalModelValue = modelValue.trim();
        result.push({
          name: getNameByModelName(model.displayName, finalModelValue) || model.model,
          value: finalModelValue,
          type: model.type,
          icon: getNameByModelName(model.iconUrl, finalModelValue, null),
          desc: getNameByModelName(model.description, finalModelValue, null),
          isDefault: model.use_as_default ?? false,
        });
      }
    } else if (Array.isArray(model.model)) {
      for (const modelName of model.model) {
        const finalModelName = modelName.trim();
        result.push({
          name: getNameByModelName(model.displayName, finalModelName) || modelName,
          value: finalModelName,
          type: model.type,
          icon: getNameByModelName(model.iconUrl, finalModelName, null),
          desc: getNameByModelName(model.description, finalModelName, null),
          isDefault: model.use_as_default ?? false,
        });
      }
    }
  }
  return result;
};

export const getDefaultModel = (type: LlmModelEndpointType) => {
  const models = getModels(type);
  return models.find((x) => x.isDefault)?.value || models[0]?.value;
};

@Injectable()
export class LlmService {
  constructor(
    private readonly toolsReopsitory: ToolsRepository,
    private readonly toolForwardServie: ToolsForwardService,
    private readonly knowledgeBaseService: KnowledgeBaseService,
    private readonly sqlKnowledgeBaseService: SqlKnowledgeBaseService,
    private readonly llmModelRepository: LlmModelRepository,
    private readonly oneApiRepository: OneApiRepository,
    private readonly mediaFileService: MediaFileService,
  ) {}

  private getModelNameByModelMappings(modelMappings: { [x: string]: string }, modelName: string): string {
    for (const key in modelMappings) {
      if (modelMappings[key] === modelName) {
        return key;
      }
    }
    return modelName;
  }

  private async getModelConfig(
    teamId: string,
    modelName: string,
  ): Promise<{
    realModelName?: string;
    baseURL: string;
    apiKey: string;
    defaultParams?: any;
    promptTemplate?: string;
    autoMergeConsecutiveMessages?: boolean;
  }> {
    if (!modelName) {
      throw new Error('Model is required, check your workflow configuration.');
    }

    const checkIsSystemModel = () => {
      return !modelName.includes(':');
    };

    const isSystemModel = checkIsSystemModel();
    if (isSystemModel) {
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
      return {
        baseURL: model.baseURL,
        apiKey: model.apiKey,
        defaultParams: model.defaultParams,
        promptTemplate: model.promptTemplate,
        autoMergeConsecutiveMessages: model.autoMergeConsecutiveMessages,
      };
    } else {
      const [channelIdStr, realModelName] = modelName.split(':');
      const channelId = parseInt(channelIdStr);
      const modelEntity = await this.llmModelRepository.getLLMModelByChannelId(channelId);
      const modelMappings = modelEntity.models;
      const oneApiUser = await this.oneApiRepository.getOneapiUserByTeamId(teamId);
      return {
        realModelName: this.getModelNameByModelMappings(modelMappings, realModelName),
        baseURL: `${config.oneapi.baseURL}/v1`,
        apiKey: `sk-${oneApiUser.apiKey}`,
      };
    }
  }

  async capMessages(systemMessages: ChatCompletionMessageParam[], historyMessages: ChatCompletionMessageParam[]) {
    // Todo: Implement this function
    // const cappedHistoryMessages = [];
    // let totalTokenCount = 0;
    // for (const message of historyMessages.reverse()) {
    //   const messageTokenCount = countTokens(message.content as string);
    //   if (totalTokenCount + messageTokenCount > maxTokens) {
    //     break;
    //   }
    //   cappedHistoryMessages.push(message);
    //   totalTokenCount += messageTokenCount;
    // }
    // logger.info(`Total token count: ${totalTokenCount}`);
    return [...systemMessages, ...historyMessages];
  }

  private sanitizeMessages(
    messages: Array<{
      role: string;
      content: string | Array<ContentPartDto>;
      name?: string;
    }>,
  ) {
    const messageHistory = messages.filter(({ content }) => !!content);
    return messageHistory;
  }

  private convertToOpenAIMessages(
    messages: Array<{
      role: string;
      content: string | Array<ContentPartDto>;
      name?: string;
    }>,
  ): Array<ChatCompletionMessageParam> {
    return messages.map((message) => {
      // 如果content是字符串，直接使用标准格式
      if (typeof message.content === 'string') {
        return {
          role: message.role as any,
          content: message.content,
          name: message.name,
        } as ChatCompletionMessageParam;
      }
      // 如果content是数组，转换为OpenAI要求的格式
      else if (Array.isArray(message.content)) {
        const formattedContent = message.content.map((item) => {
          if (item.type === 'text') {
            return {
              type: 'text',
              text: item.text,
            };
          } else if (item.type === 'image_url') {
            return {
              type: 'image_url',
              image_url: {
                url: item.image_url.url,
                detail: item.image_url.detail || 'auto',
              },
            };
          }
          return item;
        });

        return {
          role: message.role as any,
          content: formattedContent as any,
          name: message.name,
        } as ChatCompletionMessageParam;
      }

      // 兜底，避免类型错误
      return {
        role: message.role as any,
        content: '',
        name: message.name,
      } as ChatCompletionMessageParam;
    });
  }

  public async createCompelitions(teamId: string, params: CreateCompelitionsParams) {
    const { stream = false } = params;
    let { model } = params;
    const { apiKey, baseURL, defaultParams, promptTemplate, realModelName } = await this.getModelConfig(teamId, model);
    if (realModelName) {
      model = realModelName as string;
    }

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

  private resolveToolParameter(input: ToolProperty[]): ChatCompletionTool['function']['parameters'] {
    function convertType(type: string): string {
      switch (type) {
        case 'string':
          return 'string';
        case 'number':
          return 'number';
        case 'boolean':
          return 'boolean';
        case 'options':
          return 'string';
        case 'json':
          return 'object';
        default:
          return 'string';
      }
    }

    function convertProperties(properties: ToolProperty[]): any {
      const propertiesSchema: any = {};
      const requiredFields: string[] = [];

      properties.forEach((prop) => {
        propertiesSchema[prop.name] = {
          type: convertType(prop.type),
          description: getI18NValue(prop.description),
        };
        if (prop.type === 'json' && prop.properties) {
          const nestedSchema = convertProperties(prop.properties);
          propertiesSchema[prop.name].properties = nestedSchema.properties;
          if (nestedSchema.required.length > 0) {
            propertiesSchema[prop.name].required = nestedSchema.required;
          }
        }
        if (prop.type === 'options' && prop.options) {
          propertiesSchema[prop.name].enum = prop.options.map((option: any) => option.value);
        }
        if (prop.required) {
          requiredFields.push(prop.name);
        }
      });

      return {
        properties: propertiesSchema,
        required: requiredFields,
      };
    }

    const schema: any = {
      type: 'object',
      properties: {},
      required: [],
    };

    input.forEach((item) => {
      schema.properties[item.name] = {
        type: convertType(item.type),
        description: getI18NValue(item.description),
      };
      if (item.type === 'json' && item.properties) {
        const nestedSchema = convertProperties(item.properties);
        schema.properties[item.name].properties = nestedSchema.properties;
        if (nestedSchema.required.length > 0) {
          schema.properties[item.name].required = nestedSchema.required;
        }
      }
      if (item.type === 'options' && item.options) {
        schema.properties[item.name].enum = item.options.map((option: any) => option.value);
      }
      if (item.required) {
        schema.required.push(item.name);
      }
    });

    return schema;
  }

  public async resolveTools(tools: string[] | string, sqlKnowledgeBase?: string): Promise<Array<ChatCompletionTool>> {
    if (typeof tools === 'string') {
      tools = [tools];
    }
    if (sqlKnowledgeBase) {
      tools.push(SQL_KNOWLEDGE_BASE_QUERY_TABLE_TOOL);
    }
    const toolEntities = await this.toolsReopsitory.getToolsByNames(tools);
    return await Promise.all(
      toolEntities.map(async (tool): Promise<ChatCompletionTool> => {
        const toolParams = this.resolveToolParameter(tool.input);
        if (tool.name === SQL_KNOWLEDGE_BASE_QUERY_TABLE_TOOL) {
          const tableStaements = await this.sqlKnowledgeBaseService.getCreateTableStatements(sqlKnowledgeBase);
          if ((toolParams.properties as any).sql) {
            (toolParams.properties as any).sql.description = `SQL query to get data from the table. Available tables: ${tableStaements.map((table) => {
              return `Table Name：${table.name}\n Create Table Statements：${table.sql}`;
            })}`;
          }
          if ((toolParams.properties as any).sql_knowledge_base_id) {
            (toolParams.properties as any).sql_knowledge_base_id.enum = [sqlKnowledgeBase];
          }
        }
        return {
          type: 'function',
          function: {
            name: tool.name.replaceAll(':', '__'),
            parameters: toolParams,
          },
        };
      }),
    );
  }

  private async executeTool(name: string, data: any, sqlKnowledgeBase?: string) {
    logger.info(`Start to call tool call: ${name} with arguments: ${JSON.stringify(data)}`);
    name = name.replaceAll('__', ':');
    if (sqlKnowledgeBase && name === SQL_KNOWLEDGE_BASE_QUERY_TABLE_TOOL) {
      data.sql_knowledge_base_id = sqlKnowledgeBase;
    }
    const result = await this.toolForwardServie.invoke<{ [x: string]: any }>(name, data);
    logger.info(`Tool call ${name} result: ${JSON.stringify(result)}`);
    return result;
  }

  private async summarizeUserMessages(openai: OpenAI, model: string, messages: Array<ChatCompletionMessageParam>): Promise<string> {
    const userMessages = messages.filter((msg) => msg.role === 'user');
    if (userMessages.length === 1) {
      return userMessages[0].content as string;
    }
    const las5Messages = userMessages.slice(-5);
    const last5MessagesStr = las5Messages.map((msg) => msg.content).join('\n');
    const response = await openai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `You are a conversation summarizer, summarize the following conversation into a short centence representing user's question. Later we will use this question to retrieve knowledge base.\n\n

Rules:
1. The summary should be a question based on most recent questions.
2. Answer in user's language.
3. If user ask another question, use the last question.

Conversation:
\n\n
${last5MessagesStr}`,
        },
      ],
      stream: false,
      model,
    });
    return response.choices[0].message.content;
  }

  private async chooseMetadataFilterByUserMessage(openai: OpenAI, model: string, userQuestion: string, values: string[]): Promise<string[]> {
    const response = await openai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `You are a file retriever, choose the most relevant knowledge base on user's question and avaliable file names.
          
Available Files:
${values.map((x) => x).join('\n')}

Rules:
1. Choose the most relevant file names based on user's question.
2. You can choose multiple file names, max to 3.
3. Answer in user's language.
4. Answer in the format of "file1, file2, file3", separate by comma.
5. If no files found, answer "No files found".

User's Question:
${userQuestion}
`,
        },
      ],
      stream: false,
      model,
    });
    const content = response.choices[0].message.content;
    if (content.includes('No files found')) {
      return [];
    }
    return response.choices[0].message.content.split(',').map((x) => x.trim());
  }

  private async generateSystemMessages(
    openai: OpenAI,
    model: string,
    messages: Array<any>, // 使用更通用的类型
    presetPrompt: string,
    knowledgeBase: string,
  ): Promise<{
    systemMessages: Array<ChatCompletionMessageParam>;
    generatedByKnowledgeBase: string;
  }> {
    let finalSystemPrompt = '';
    let knowledgeBaseContext = '';
    let generatedByKnowledgeBase: string = null;
    // System messages set by API Call
    if (knowledgeBase) {
      const useMessages = messages.filter((msg) => msg.role === 'user');
      if (useMessages.length > 0) {
        const summarizedUserMessage = await this.summarizeUserMessages(openai, model, useMessages);
        const valuesToFilterByMetadataKey = await this.knowledgeBaseService.valuesToFilterByMetadataKey(knowledgeBase);
        let metadataFilterValues = undefined;
        if (valuesToFilterByMetadataKey?.length) {
          metadataFilterValues = await this.chooseMetadataFilterByUserMessage(openai, model, summarizedUserMessage, valuesToFilterByMetadataKey);
        }
        try {
          logger.info(`Start to retrieve knowledge base: ${knowledgeBase} with summarized user message: ${summarizedUserMessage}, metadataFilterValues: ${metadataFilterValues}`);
          const retrieveResult = await this.knowledgeBaseService.retrieveKnowledgeBase(knowledgeBase, summarizedUserMessage, metadataFilterValues);
          if (retrieveResult?.text) {
            logger.info(`Retrieved knowledge base: ${retrieveResult.text.slice(0, 200)}`);
            knowledgeBaseContext = retrieveResult.text;
            generatedByKnowledgeBase = knowledgeBase;
          } else {
            logger.info(`Not found any knowledge based on question: ${summarizedUserMessage}`);
          }
        } catch (error) {
          logger.warn(`Failed to retrieve knowledge base: ${error.message}`);
        }
      }
    }

    if (presetPrompt && !knowledgeBaseContext) {
      finalSystemPrompt = presetPrompt;
    } else if (knowledgeBaseContext && !presetPrompt) {
      const basePrompt = config.llm.templates.knowledgeBase;
      finalSystemPrompt = basePrompt.replace('{{#context#}}', knowledgeBaseContext);
    } else if (presetPrompt && knowledgeBaseContext) {
      const basePrompt = config.llm.templates.knowledgeBaseWithPresetPrompt;
      finalSystemPrompt = basePrompt.replace('{{#context#}}', knowledgeBaseContext).replace('{{#presetPrompt#}}', presetPrompt);
    }

    if (!finalSystemPrompt) {
      return {
        generatedByKnowledgeBase: null,
        systemMessages: [],
      };
    }
    return {
      generatedByKnowledgeBase: generatedByKnowledgeBase,
      systemMessages: [
        {
          role: 'system',
          content: finalSystemPrompt,
        },
      ],
    };
  }

  private mergeConsecutiveMessages(messages: ChatCompletionMessageParam[]): ChatCompletionMessageParam[] {
    if (messages.length === 0) {
      return [];
    }

    const mergedMessages: ChatCompletionMessageParam[] = [];
    let currentMessage = { ...messages[0] };

    for (let i = 1; i < messages.length; i++) {
      if (messages[i].role === currentMessage.role) {
        currentMessage.content += '\n\n' + messages[i].content;
      } else {
        mergedMessages.push(currentMessage);
        currentMessage = { ...messages[i] };
      }
    }

    mergedMessages.push(currentMessage);
    return mergedMessages;
  }

  private geneChunkLine(chatCmplId: string, model: string, chunkString: string) {
    const chunkObject = {
      id: chatCmplId,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: model,
      system_fingerprint: null,
      choices: [{ index: 0, delta: { content: chunkString }, logprobs: null, finish_reason: null }],
    };
    return `data: ${JSON.stringify(chunkObject, replacerNoEscape, 0)}\n\n`;
  }

  private geneLogLine(loglId: string, type: 'retrive_knowledge_base' | 'tool_call', level: LogLevel, message: string, detailedInfo: { [x: string]: any }) {
    const logObject = {
      id: loglId,
      object: 'chat.completion.log',
      created: Math.floor(Date.now() / 1000),
      system_fingerprint: null,
      data: {
        type,
        level: level,
        message: message,
        detailedInfo,
      },
    };
    return {
      obj: logObject,
      str: `data: ${JSON.stringify(logObject, replacerNoEscape, 0)}\n\n`,
    };
  }

  private setErrorResponse(res: Response, randomChatCmplId: string, model: string, stream: boolean, errorMsg: string) {
    res.status(400);
    errorMsg = 'An Unexpected Error Occurred: ' + errorMsg;
    if (stream) {
      for (const token of errorMsg.split('')) {
        const chunkLine = this.geneChunkLine('chatcmpl-' + randomChatCmplId, model, token);
        res.write(chunkLine);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      return res.status(500).send(errorMsg);
    }
  }

  public async replaceMarkdownImageUrls(content: string, teamId: string, userId: string) {
    const imageLinks = extractMarkdownImageUrls(content);
    const replaceMap = new Map<string, string>();
    if (imageLinks.length > 0) {
      const promises = imageLinks.map(async (url) => {
        try {
          const image = await axios.get(url, { responseType: 'arraybuffer' });
          const md5 = await calculateMd5FromArrayBuffer(image.data);
          const data = await this.mediaFileService.getMediaByMd5(teamId, md5);
          if (!data) {
            try {
              const s3Helpers = new S3Helpers();
              const s3UploadedUrl = await s3Helpers.uploadFile(image.data, `llm-generated-images/${md5}.${getFileExtensionFromUrl(url)}`);
              const s3Url = config.s3.isPrivate ? await s3Helpers.getSignedUrl(md5) : s3UploadedUrl;
              const createdData = await this.mediaFileService.createMedia(teamId, userId, {
                type: 'image',
                displayName: s3Url,
                url: s3Url,
                source: 1,
                params: {
                  url: s3Url,
                },
                size: image.data.byteLength,
                md5,
              });

              replaceMap.set(url, (createdData as MediaFileEntity).url);
            } catch (error) {
              logger.error(`Failed to create media file: ${url}`, error);
            }
          } else {
            replaceMap.set(url, data.url);
          }
        } catch (e) {
          logger.error(`Failed to get image: ${url}`, e);
        }
      });
      await Promise.all(promises);
      content = replaceMarkdownImageUrls(content, replaceMap);
    }
    return content;
  }

  public async createChatCompelitions(res: Response, teamId: string, params: CreateChatCompelitionsParams, options?: CreateChatCompelitionsResponseOptions) {
    const { apiResponseType = 'full', showLogs = false, onSuccess, onFailed } = options || {};
    if (apiResponseType === 'simple' && params.stream) {
      throw new Error('Stream is not supported in simple api response type');
    }
    let { model } = params;
    const { stream, systemPrompt, knowledgeBase, sqlKnowledgeBase, response_format = ResponseFormat.text } = params;

    // Messages passed by the user
    let { messages } = params;
    const historyMessages = this.sanitizeMessages(messages);

    if (stream) {
      // set the content type to text-stream
      res.setHeader('content-type', 'text/event-stream;charset=utf-8');
      res.status(200);
    }
    const { apiKey, baseURL, defaultParams, realModelName, autoMergeConsecutiveMessages = false } = await this.getModelConfig(teamId, model);
    if (realModelName) {
      model = realModelName as string;
    }

    const openai = new OpenAI({
      apiKey: apiKey || 'mock-apikey',
      baseURL: baseURL,
      maxRetries: config.llm.maxRetries,
      timeout: config.llm.timeout,
    });

    // Generate system messages
    const { generatedByKnowledgeBase, systemMessages } = await this.generateSystemMessages(openai, model, messages, systemPrompt, knowledgeBase);
    const randomChatCmplId = Math.random().toString(36).substr(2, 16);

    const logs = [];
    const sendAndCollectLogs = (level: LogLevel, type: 'retrive_knowledge_base' | 'tool_call', message: string, detailedInfo: { [x: string]: any }) => {
      if (showLogs) {
        const { str, obj } = this.geneLogLine('chatlog-' + randomChatCmplId, type, level, message, detailedInfo);
        res.write(str);
        logs.push(obj);
      }
    };

    if (systemMessages.length && generatedByKnowledgeBase) {
      sendAndCollectLogs('info', 'retrive_knowledge_base', 'Generated system message: ' + systemMessages[0].content, {
        knowledgeBaseId: generatedByKnowledgeBase,
      });
    }

    // 转换消息格式并进行类型转换
    const openAIHistoryMessages = this.convertToOpenAIMessages(historyMessages);

    // Cap messages
    const cappedMessages = await this.capMessages(systemMessages, openAIHistoryMessages);

    // 使用转换后的消息
    let openAIMessages = cappedMessages;

    // Merge consecutive messages
    if (autoMergeConsecutiveMessages) {
      openAIMessages = this.mergeConsecutiveMessages(openAIMessages);
    }

    const tools: Array<ChatCompletionTool> = await this.resolveTools(params.tools || [], sqlKnowledgeBase);

    let response: ChatCompletion | Stream<ChatCompletionChunk>;
    const createChatCompelitionsBody: ChatCompletionCreateParamsBase = {
      model,
      stream: stream,
      temperature: params.temperature ?? undefined,
      frequency_penalty: params.frequency_penalty ?? undefined,
      presence_penalty: params.presence_penalty ?? undefined,
      max_tokens: params.max_tokens ?? undefined,
      messages: openAIMessages, // 使用转换后的消息格式
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
    };
    try {
      logger.info(`Start to create chat completions: baseURL=${baseURL}, apiKey=${maskString(apiKey)}, model=${model}, stream=${stream}, messages=${JSON.stringify(messages)}`);
      response = await openai.chat.completions.create(createChatCompelitionsBody);
    } catch (error) {
      let errorMsg: string = error.message;
      // Can't get the error message when stream mode is on, make a anothier request to get the error message
      if (stream) {
        try {
          await axios.post(`${baseURL}/chat/completions`, {
            ...createChatCompelitionsBody,
            stream: false,
          });
        } catch (error) {
          errorMsg = error.response?.data?.message || error.message;
        }
      }
      logger.error(`Failed to create chat completions: `, error);
      logger.error(`Failed to create chat completions: `, errorMsg);
      onFailed?.(errorMsg);
      return this.setErrorResponse(res, randomChatCmplId, model, stream, errorMsg);
    }

    try {
      if (stream) {
        const data = new StreamData();
        const streamResponse = OpenAIStream(response as Stream<ChatCompletionChunk>, {
          experimental_onToolCall: async (call: ToolCallPayload, appendToolCallMessage) => {
            for (const toolCall of call.tools) {
              let toolResult: any;
              try {
                sendAndCollectLogs('info', 'tool_call', `Start to execute tool call ${toolCall.func.name} with arguments: ${JSON.stringify(toolCall.func.arguments)}`, {
                  toolCallId: toolCall.id,
                  toolName: toolCall.func.name.replace('__', ':'),
                  arguments: toolCall.func.arguments,
                  status: 'inprogress',
                });
                toolResult = await this.executeTool(toolCall.func.name, toolCall.func.arguments, sqlKnowledgeBase);
                sendAndCollectLogs('info', 'tool_call', `Tool call ${toolCall.func.name} result: ${JSON.stringify(toolResult)}`, {
                  toolCallId: toolCall.id,
                  toolName: toolCall.func.name.replace('__', ':'),
                  arguments: toolCall.func.arguments,
                  result: toolResult,
                  status: 'success',
                });
              } catch (error) {
                sendAndCollectLogs('error', 'tool_call', `Failed to execute tool call: ${toolCall.func.name}, error: ${error.message}`, {
                  toolCallId: toolCall.id,
                  toolName: toolCall.func.name.replace('__', ':'),
                  arguments: toolCall.func.arguments,
                  error: error.message,
                  status: 'failed',
                });
                logger.error(`Failed to execute tool call: ${toolCall.func.name}`, error);
                toolResult = `Can't find anything related`;
              }
              const toolMessages = appendToolCallMessage({
                tool_call_id: toolCall.id,
                function_name: toolCall.func.name,
                tool_call_result: toolResult,
              });
              for (const toolMessage of toolMessages) {
                if (toolMessage.content?.length > config.llm.toolResultMaxLength) {
                  toolMessage.content = toolMessage.content.slice(0, config.llm.toolResultMaxLength) + '...';
                }
              }
              return openai.chat.completions.create({
                messages: [...openAIMessages, ...toolMessages] as Array<ChatCompletionMessageParam>,
                model,
                stream: true,
                tools,
                tool_choice: 'auto',
              });
            }
          },
          onCompletion(completion) {
            onSuccess?.(completion);
            logger.info(`Completion Finished: ${completion}`);
          },
          onFinal() {
            res.write('data: [DONE]\n\n');
            res.end();
          },
        });
        const streamingTextResponse = new StreamingTextResponse(streamResponse, {}, data);

        const body = streamingTextResponse.body;
        const readableStream = Readable.from(body as any);
        readableStream.on('data', (chunk) => {
          const decoder = new TextDecoder();
          let chunkString = decoder.decode(chunk);
          // Original String: 0:"你", contains the beginning 0: and the first and last double quotes
          chunkString = chunkString.slice(2, -1).slice(1, -1);
          const chunkLine = this.geneChunkLine('chatcmpl-' + randomChatCmplId, model, chunkString);
          res.write(chunkLine);
        });
      } else {
        const data = response as ChatCompletion;
        if (data.choices[0].message.tool_calls?.length) {
          let toolMessages: Array<ChatCompletionMessageParam> = [];
          const toolCalls = data.choices[0].message.tool_calls;
          for (const toolCall of toolCalls) {
            const {
              function: { name, arguments: argumentsData },
            } = toolCall;
            let toolResult: any;
            try {
              sendAndCollectLogs('info', 'tool_call', `Start to execute tool call ${name} with arguments: ${JSON.stringify(argumentsData)}`, {
                toolCallId: toolCall.id,
                toolName: name.replace('__', ':'),
                arguments: argumentsData,
                status: 'inprogress',
              });
              toolResult = await this.executeTool(name, argumentsData, sqlKnowledgeBase);
              sendAndCollectLogs('info', 'tool_call', `Tool call ${name} result: ${JSON.stringify(toolResult)}`, {
                toolCallId: toolCall.id,
                toolName: name.replace('__', ':'),
                arguments: argumentsData,
                result: toolResult,
                status: 'success',
              });
            } catch (error) {
              sendAndCollectLogs('error', 'tool_call', `Failed to execute tool call: ${name}, error: ${error.message}`, {
                toolCallId: toolCall.id,
                toolName: name.replace('__', ':'),
                arguments: argumentsData,
                error: error.message,
                status: 'failed',
              });
              logger.error(`Failed to execute tool call: ${name}`, error);
              toolResult = `Can't find anything related`;
            }
            toolMessages = toolMessages.concat([
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
            for (const toolMessage of toolMessages) {
              if (toolMessage.content?.length > config.llm.toolResultMaxLength) {
                toolMessage.content = toolMessage.content.slice(0, config.llm.toolResultMaxLength) + '...';
              }
            }
          }
          const result = await openai.chat.completions.create({
            messages: [...openAIMessages, ...toolMessages] as Array<ChatCompletionMessageParam>,
            model,
            stream: false,
            tools,
            tool_choice: 'auto',
          });

          if (showLogs) {
            (result as any).logs = logs;
          }

          let content = result.choices[0].message?.content ?? '';
          if (!stream && isMarkdown(content) && options?.userId) content = await this.replaceMarkdownImageUrls(content, teamId, options.userId);
          onSuccess?.(content);
          return res.status(200).send(
            apiResponseType === 'full'
              ? result
              : {
                  messages: content,
                  usage: result.usage,
                },
          );
        } else {
          if (showLogs) {
            (response as any).logs = logs;
          }
          let content = (response as ChatCompletion).choices[0].message?.content;
          if (!stream && isMarkdown(content) && options?.userId) content = await this.replaceMarkdownImageUrls(content, teamId, options.userId);
          onSuccess?.(content);
          return res.status(200).send(
            apiResponseType === 'full'
              ? response
              : {
                  message: content,
                  usage: (response as ChatCompletion).usage,
                },
          );
        }
      }
    } catch (error) {
      logger.error(`Failed to create chat completions: `, error);
      onFailed?.(error.message);
      return this.setErrorResponse(res, randomChatCmplId, model, stream, error.message);
    }
  }
}
