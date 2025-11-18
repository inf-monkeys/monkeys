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
import axios from 'axios';
import { Response } from 'express';
import OpenAI from 'openai';
import { ChatCompletion, ChatCompletionChunk, ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources';
import { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions';
import { Stream } from 'openai/streaming';
import { KnowledgeBaseService } from '../../assets/knowledge-base/knowledge-base.service';
import { ReActStepManager } from '../builtin/react-step-manager';
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
  mode?: 'chat' | 'react';
  maxReActSteps?: number;
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
    private readonly reactStepManager: ReActStepManager,
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
    const messageHistory = messages.filter(({ content, role }) => {
      if (!content) return false;

      // 过滤掉错误格式的工具调用消息
      if (role === 'assistant' && typeof content === 'string') {
        // 检查是否是被错误序列化的工具调用
        if (content.includes('tool_calls') && (content.startsWith('{') || content.startsWith('{"'))) {
          console.log('[DEBUG] Filtering out malformed tool call message:', content.substring(0, 100));
          return false;
        }
      }

      return true;
    });
    return messageHistory;
  }

  private convertToOpenAIMessages(
    messages: Array<{
      role: string;
      content: string | Array<ContentPartDto>;
      name?: string;
    }>,
  ): Array<ChatCompletionMessageParam> {
    return messages
      .filter(({ content, role }) => {
        // 再次过滤错误格式的工具调用消息
        if (role === 'assistant' && typeof content === 'string') {
          if (content.includes('tool_calls') && (content.startsWith('{') || content.startsWith('{"'))) {
            console.log('[DEBUG] Filtering malformed tool call in convertToOpenAI:', content.substring(0, 100));
            return false;
          }
        }
        return !!content;
      })
      .map((message) => {
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

    const resolvedTools: Array<ChatCompletionTool> = [];
    const dbToolNames: string[] = [];
    const reactToolNames: string[] = [];

    // 分离ReAct工具和数据库工具
    for (const toolName of tools) {
      if (['ask_followup_question', 'new_task', 'update_todo_list', 'task_completion'].includes(toolName)) {
        reactToolNames.push(toolName);
      } else {
        dbToolNames.push(toolName);
      }
    }

    // 处理数据库工具
    if (dbToolNames.length > 0) {
      const toolEntities = await this.toolsReopsitory.getToolsByNames(dbToolNames);
      const dbTools = await Promise.all(
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
      resolvedTools.push(...dbTools);
    }

    // 处理内置ReAct工具
    for (const reactToolName of reactToolNames) {
      let toolDefinition: ChatCompletionTool;

      switch (reactToolName) {
        case 'ask_followup_question':
          toolDefinition = {
            type: 'function',
            function: {
              name: 'ask_followup_question',
              description: 'Ask users for more information when you need clarification or additional details',
              parameters: {
                type: 'object',
                properties: {
                  question: { type: 'string', description: 'Clear, specific question' },
                  suggestions: { type: 'array', items: { type: 'string' }, description: 'List of suggested answers' },
                },
                required: ['question'],
              },
            },
          };
          break;
        case 'new_task':
          toolDefinition = {
            type: 'function',
            function: {
              name: 'new_task',
              description: 'Create a new task with an initial todo list for complex multi-step work. MUST be called first for any complex task.',
              parameters: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    description: 'Task description explaining what needs to be accomplished',
                  },
                  todos: {
                    type: 'string',
                    description: 'Initial todo list in markdown format with [ ] for pending tasks',
                  },
                },
                required: ['message'],
              },
            },
          };
          break;
        case 'update_todo_list':
          toolDefinition = {
            type: 'function',
            function: {
              name: 'update_todo_list',
              description: 'Update the full TODO list with current progress status',
              parameters: {
                type: 'object',
                properties: {
                  todos: { type: 'string', description: 'Complete todo list with status updates' },
                },
                required: ['todos'],
              },
            },
          };
          break;
        case 'task_completion':
          toolDefinition = {
            type: 'function',
            function: {
              name: 'task_completion',
              description: 'Summarize results when the task is completed',
              parameters: {
                type: 'object',
                properties: {
                  result: { type: 'string', description: 'Final result or answer' },
                  summary: { type: 'string', description: 'Summary of the process' },
                },
                required: ['result'],
              },
            },
          };
          break;
        default:
          continue;
      }
      resolvedTools.push(toolDefinition);
    }

    return resolvedTools;
  }

  private async executeTool(name: string, data: any, sqlKnowledgeBase?: string, sessionId?: string, maxSteps?: number) {
    logger.info(`Start to call tool call: ${name} with arguments: ${JSON.stringify(data)}`);
    name = name.replaceAll('__', ':');

    // ReAct模式下发送步骤开始事件
    let stepId: string | undefined;
    if (sessionId && this.reactStepManager.isSessionActive(sessionId)) {
      // 根据工具名称确定步骤类型和标题
      let stepType: 'new_task' | 'update_todo_list' | 'ask_followup_question' | 'task_completion' | 'thinking' = 'thinking';
      let title = `执行工具: ${name}`;

      if (name === 'new_task') {
        stepType = 'new_task';
        title = `创建新任务: ${data.message || ''}`;
      } else if (name === 'update_todo_list') {
        stepType = 'update_todo_list';
        title = '更新任务列表';
      } else if (name === 'ask_followup_question') {
        stepType = 'ask_followup_question';
        title = `询问问题: ${data.question || ''}`;
      } else if (name === 'task_completion') {
        stepType = 'task_completion';
        title = '任务完成';
      }

      stepId = this.reactStepManager.sendStepStart(sessionId, stepType, title, {
        name,
        arguments: data,
      });
    }

    if (sqlKnowledgeBase && name === SQL_KNOWLEDGE_BASE_QUERY_TABLE_TOOL) {
      data.sql_knowledge_base_id = sqlKnowledgeBase;
    }

    // 为ReAct工具传递会话上下文
    const context = sessionId ? { sessionId, maxSteps } : undefined;

    try {
      const result = await this.toolForwardServie.invoke<{ [x: string]: any }>(name, data, context);
      logger.info(`Tool call ${name} result: ${JSON.stringify(result)}`);

      // ReAct模式下发送步骤完成事件
      if (stepId && sessionId && this.reactStepManager.isSessionActive(sessionId)) {
        // 解析工具结果中的特殊数据
        const metadata: any = {};
        if (name === 'new_task' || name === 'update_todo_list') {
          // 尝试解析待办事项列表
          const resultStr = typeof result === 'string' ? result : JSON.stringify(result);
          const todoMatch = resultStr.match(/Todo items?:\s*([\s\S]*?)(?:\n\n|\n*$)/i);
          if (todoMatch) {
            const todoLines = todoMatch[1].split('\n').filter((line) => line.trim());
            metadata.todos = todoLines
              .map((line, index) => ({
                id: `todo_${Date.now()}_${index}`,
                content: line.replace(/^\s*[-\[\] ]*/, '').trim(),
                status: line.includes('[x]') ? 'completed' : line.includes('[-]') ? 'in_progress' : 'pending',
              }))
              .filter((todo) => todo.content);
          }
        } else if (name === 'ask_followup_question') {
          metadata.question = data.question;
          metadata.suggestions = data.suggestions;
        }

        this.reactStepManager.sendStepComplete(sessionId, stepId, typeof result === 'string' ? result : JSON.stringify(result), metadata);
      }

      return result;
    } catch (error) {
      logger.error(`Tool call ${name} failed:`, error);

      // ReAct模式下发送错误事件
      if (stepId && sessionId && this.reactStepManager.isSessionActive(sessionId)) {
        this.reactStepManager.sendError(sessionId, error.message, stepId);
      }

      throw error;
    }
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
    const { stream, systemPrompt, knowledgeBase, sqlKnowledgeBase, response_format = ResponseFormat.text, mode = 'chat', maxReActSteps = 10 } = params;

    // 临时：为ReAct模式关闭流模式以避免与工具循环逻辑冲突
    let actualStream = mode === 'react' ? false : stream;

    // 为ReAct模式生成sessionId
    const sessionId = mode === 'react' ? `react_session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}` : undefined;

    console.log('[DEBUG] LLM Service 模式参数:', {
      mode,
      maxReActSteps,
      hasSystemPrompt: !!systemPrompt,
      sessionId,
    });

    // 根据模式处理工具和系统提示词
    let modeSpecificTools: string[] = [];
    let finalSystemPrompt = systemPrompt;

    if (mode === 'react') {
      // ReAct 模式：使用任务管理工具
      modeSpecificTools = ['ask_followup_question', 'new_task', 'update_todo_list', 'task_completion'];

      console.log('[DEBUG] 启用ReAct模式，添加任务管理工具:', modeSpecificTools);

      // 导入 ReAct 工具服务来生成系统提示词
      const { ReActToolsService } = await import('../builtin/react-tools');
      const reactTools = new ReActToolsService();
      const reactSystemPrompt = reactTools.generateSystemPrompt();

      finalSystemPrompt = `${systemPrompt || ''}

${reactSystemPrompt}`;
    }
    // chat 模式保持原有逻辑，不添加额外工具

    // Messages passed by the user
    const { messages } = params;
    console.log('[DEBUG] Raw messages received:', JSON.stringify(messages, null, 2));
    const historyMessages = this.sanitizeMessages(messages);
    console.log('[DEBUG] Messages after sanitization:', JSON.stringify(historyMessages, null, 2));

    if (actualStream && res) {
      // 只有在有 res 对象时才设置 header
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
      maxRetries: config.llm.maxRetries || 5, // 增加重试次数
      timeout: config.llm.timeout || 60000, // 增加超时时间到60秒
    });

    // Generate system messages
    const { generatedByKnowledgeBase, systemMessages } = await this.generateSystemMessages(openai, model, messages, finalSystemPrompt, knowledgeBase);
    const randomChatCmplId = Math.random().toString(36).substr(2, 16);

    const logs = [];
    const sendAndCollectLogs = (level: LogLevel, type: 'retrive_knowledge_base' | 'tool_call', message: string, detailedInfo: { [x: string]: any }) => {
      if (showLogs && res) {
        // 只有在有 res 对象时才写日志流
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

    // 最终检查和清理消息
    const cleanedMessages = openAIHistoryMessages.filter((msg) => {
      if (typeof msg.content === 'string' && msg.content.includes('tool_calls')) {
        console.log('[DEBUG] Final filter: removing malformed message:', msg.content.substring(0, 100));
        return false;
      }
      return true;
    });
    console.log('[DEBUG] Final cleaned messages count:', cleanedMessages.length);

    // Cap messages
    const cappedMessages = await this.capMessages(systemMessages, cleanedMessages);

    // 使用转换后的消息
    let openAIMessages = cappedMessages;

    // Merge consecutive messages
    if (autoMergeConsecutiveMessages) {
      openAIMessages = this.mergeConsecutiveMessages(openAIMessages);
    }

    // 根据模式合并工具
    const userTools = params.tools || [];
    let allTools: string[] = [];

    if (mode === 'react') {
      // ReAct 模式：只使用思维工具，不允许混合功能性工具
      allTools = [...modeSpecificTools];
    } else {
      // Chat 模式：使用用户配置的功能性工具
      allTools = [...userTools];
    }
    const tools: Array<ChatCompletionTool> = await this.resolveTools(allTools, sqlKnowledgeBase);

    // 为简化实现，目前仅在没有工具时开启流式输出
    // 带工具的场景统一走非流式分支，功能保持一致，只是不再边生成边返回。
    if (actualStream && tools?.length) {
      actualStream = false;
    }

    let response: ChatCompletion | Stream<ChatCompletionChunk>;
    const createChatCompelitionsBody: ChatCompletionCreateParamsBase = {
      model,
      stream: actualStream,
      temperature: params.temperature ?? undefined,
      frequency_penalty: params.frequency_penalty ?? undefined,
      presence_penalty: params.presence_penalty ?? undefined,
      max_tokens: params.max_tokens ?? (mode === 'react' ? 8000 : undefined),
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

    // 用于存储ReAct模式下最后一个工具调用的结果
    let lastToolResult: string = '';

    try {
      logger.info(`Start to create chat completions: baseURL=${baseURL}, apiKey=${maskString(apiKey)}, model=${model}, stream=${actualStream}, messages=${JSON.stringify(openAIMessages)}`);
      response = await openai.chat.completions.create(createChatCompelitionsBody);
      console.log('[DEBUG] OpenAI response created successfully, response type:', typeof response);
      if (actualStream) {
        console.log('[DEBUG] Response is a stream, beginning stream processing');
      } else {
        console.log('[DEBUG] Response is not a stream, processing as regular response');
      }
    } catch (error) {
      let errorMsg: string = error.message;
      // Can't get the error message when stream mode is on, make a anothier request to get the error message
      if (actualStream) {
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

      if (res) {
        return this.setErrorResponse(res, randomChatCmplId, model, actualStream, errorMsg);
      } else {
        throw error;
      }
    }

    try {
      if (actualStream) {
        // 流式场景：当前仅支持无工具的纯文本流，工具调用将在非流模式下处理
        console.log('[DEBUG] Starting direct stream processing without AI SDK helpers');
        const stream = response as Stream<ChatCompletionChunk>;
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta;
            const chunkString = typeof delta?.content === 'string' ? delta.content : '';
            if (!chunkString) continue;
            const line = this.geneChunkLine('chatcmpl-' + randomChatCmplId, model, chunkString);
            if (res) {
              res.write(line);
            }
          }
          if (res) {
            res.write('data: [DONE]\n\n');
            res.end();
          }
        } catch (streamError) {
          logger.error('Failed during streaming completion:', streamError);
          if (res) {
            return this.setErrorResponse(res, randomChatCmplId, model, true, (streamError as Error).message);
          }
          throw streamError;
        }
      } else {
        // Non-streaming completion with tool call loop
        console.log('[DEBUG] Starting non-streaming tool call processing');

        let currentResponse = response as ChatCompletion;
        const allToolMessages: Array<ChatCompletionMessageParam> = [];
        let maxToolCallRounds = 15; // 增加到15轮，确保完整的ReAct流程
        let stepCount = 0;

        while (currentResponse.choices[0].message?.tool_calls?.length && maxToolCallRounds > 0) {
          console.log(`[DEBUG] Processing tool calls (round ${16 - maxToolCallRounds}, step ${stepCount})`);
          const toolCalls = currentResponse.choices[0].message.tool_calls;

          // 添加助手消息（包含工具调用）
          allToolMessages.push({
            role: 'assistant',
            content: currentResponse.choices[0].message.content || '',
            tool_calls: toolCalls,
          });

          // 检查是否调用了task_completion，如果是则记录并准备结束
          let isTaskCompletion = false;

          for (const toolCall of toolCalls) {
            const {
              function: { name, arguments: argumentsData },
            } = toolCall;

            if (name === 'task_completion') {
              isTaskCompletion = true;
              console.log('[DEBUG] task_completion called, this will be the final round');
            }

            let toolResult: any;
            try {
              sendAndCollectLogs('info', 'tool_call', `Start to execute tool call ${name} with arguments: ${JSON.stringify(argumentsData)}`, {
                toolCallId: toolCall.id,
                toolName: name.replace('__', ':'),
                arguments: argumentsData,
                status: 'inprogress',
              });
              // 处理空的arguments参数，避免JSON.parse错误
              let parsedArgumentsData: any = argumentsData;
              if (typeof parsedArgumentsData === 'string') {
                if (parsedArgumentsData.trim() === '') {
                  parsedArgumentsData = {};
                } else {
                  try {
                    parsedArgumentsData = JSON.parse(parsedArgumentsData);
                  } catch (e) {
                    logger.warn(`Failed to parse tool arguments: ${parsedArgumentsData}, using empty object`);
                    parsedArgumentsData = {};
                  }
                }
              } else if (!parsedArgumentsData) {
                parsedArgumentsData = {};
              }
              toolResult = await this.executeTool(name, parsedArgumentsData, sqlKnowledgeBase, sessionId, maxReActSteps);

              // 存储最后一个工具结果，特别是task_completion的结果
              if (name === 'task_completion') {
                lastToolResult = toolResult as string;
                console.log('[DEBUG] Stored task_completion result for final output');
              }
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
            // 添加工具结果消息
            allToolMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult),
            });
          }

          // 限制消息长度
          for (const toolMessage of allToolMessages) {
            if (toolMessage.content?.length > config.llm.toolResultMaxLength) {
              toolMessage.content = toolMessage.content.slice(0, config.llm.toolResultMaxLength) + '...';
            }
          }

          stepCount++;
          maxToolCallRounds--;

          // 如果调用了task_completion，直接结束循环
          if (isTaskCompletion) {
            console.log('[DEBUG] task_completion executed, ending tool call loop');
            break;
          }

          // 简化的ReAct逻辑：每次都必须调用工具
          try {
            console.log(`[DEBUG] Calling OpenAI for next round (${allToolMessages.length} messages)`);

            currentResponse = await openai.chat.completions.create({
              messages: [
                ...openAIMessages,
                ...allToolMessages,
                {
                  role: 'system',
                  content: `ReAct Mode: You MUST call a function in every response.

Step ${stepCount}: Check your todo list:
- Items with [ ] or [-] = continue working on next item
- All items [x] = call task_completion  
- YOU MUST CALL A FUNCTION - never just write text`,
                },
              ] as Array<ChatCompletionMessageParam>,
              model,
              stream: false,
              tools,
              tool_choice: 'auto',
              max_tokens: 4000,
            });

            console.log('[DEBUG] Response:', {
              finish_reason: currentResponse.choices[0].finish_reason,
              tool_calls: currentResponse.choices[0].message?.tool_calls?.length || 0,
            });

            // 如果没有调用工具，强制重新回复
            if (!currentResponse.choices[0].message?.tool_calls?.length) {
              console.log('[DEBUG] No tool calls detected, forcing AI to use tools');

              currentResponse = await openai.chat.completions.create({
                messages: [
                  ...openAIMessages,
                  ...allToolMessages,
                  {
                    role: 'system',
                    content: 'ERROR: You must call a function. Either update_todo_list or task_completion. Choose now.',
                  },
                ] as Array<ChatCompletionMessageParam>,
                model,
                stream: false,
                tools,
                tool_choice: 'auto',
                max_tokens: 2000,
              });

              // 如果还是不调用工具，直接强制task_completion结束
              if (!currentResponse.choices[0].message?.tool_calls?.length) {
                console.log('[DEBUG] Still no tools, forcing task_completion');
                currentResponse = await openai.chat.completions.create({
                  messages: [...openAIMessages, ...allToolMessages],
                  model,
                  stream: false,
                  tools,
                  tool_choice: {
                    type: 'function',
                    function: { name: 'task_completion' },
                  },
                  max_tokens: 1000,
                });
              }
            }
          } catch (error) {
            console.log('[DEBUG] Error:', error.message);
            break;
          }
        }

        console.log(`[DEBUG] Tool call loop completed. Steps: ${stepCount}, Remaining rounds: ${maxToolCallRounds}`);

        // 为ReAct模式设置最终响应内容
        if (mode === 'react' && lastToolResult) {
          // 创建一个包含工具结果的响应对象
          (currentResponse as any).finalContent = lastToolResult;
        }

        response = currentResponse;
      }

      // Final response processing
      if (showLogs) {
        (response as any).logs = logs;
      }

      let content = (response as ChatCompletion).choices[0].message?.content ?? '';

      // ReAct模式特殊处理：如果有finalContent，使用它作为最终输出
      if (mode === 'react' && (response as any).finalContent) {
        content = (response as any).finalContent;
        console.log('[DEBUG] Using ReAct task_completion result as final content');
      }

      // ReAct模式下发送任务完成事件
      if (mode === 'react' && sessionId && this.reactStepManager.isSessionActive(sessionId)) {
        const finalResult = lastToolResult || content;
        this.reactStepManager.sendTaskComplete(sessionId, finalResult);
      }

      if (!actualStream && isMarkdown(content) && options?.userId) {
        content = await this.replaceMarkdownImageUrls(content, teamId, options.userId);
      }
      onSuccess?.(content);

      if (res) {
        console.log('[DEBUG] Sending final response. Content length:', content.length);
        return res.status(200).send(apiResponseType === 'full' ? response : { message: content, usage: (response as ChatCompletion).usage });
      } else {
        console.log('[DEBUG] Returning response without res object');
        return apiResponseType === 'full' ? response : { message: content, usage: (response as ChatCompletion).usage };
      }
    } catch (error) {
      logger.error(`Failed to create chat completions: `, error);
      onFailed?.(error.message);
      if (res) {
        return this.setErrorResponse(res, randomChatCmplId, model, actualStream, error.message);
      } else {
        throw error;
      }
    }
  }
}
