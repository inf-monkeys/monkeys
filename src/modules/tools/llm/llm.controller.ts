import {
  MonkeyToolCategories,
  MonkeyToolDescription,
  MonkeyToolDisplayName,
  MonkeyToolExtra,
  MonkeyToolIcon,
  MonkeyToolInput,
  MonkeyToolName,
  MonkeyToolOutput,
} from '@/common/decorators/monkey-block-api-extensions.decorator';
import { ApiType, AuthType, ManifestJson, SchemaVersion } from '@/common/typings/tools';
import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CreateChatCompletionsDto } from './dto/req/create-chat-compltion.dto';
import { CreateCompletionsDto } from './dto/req/create-compltions.dto';
import { GenerateTextByLlmDto } from './dto/req/generate-text-by-llm.dto';
import {
  FREQUENCY_PENALTY_PROPERTY,
  KNOWLEDGE_BASE_PROPERTY,
  MAX_TOKEN_PROPERTY,
  MODEL_PROPERTY,
  PRESENCE_PENALTY_PROPERTY,
  RESPONSE_FORMAT_PROPERTY,
  SQL_KNOWLEDGE_BASE_PROPERTY,
  STREAM_PROPERTY,
  SYSTEM_PROMOT_PROPERTY,
  TEMPERATURE_PROPERTY,
  TOOLS_PROPERTY,
  USER_MESSAGE_PROPERTY,
} from './llm.consts';
import { LlmService, getModels } from './llm.service';
import { CHAT_TOOL_OPENAPI_PATH } from './llm.swagger';

const ErrorMessage: { [key: string]: string } = {
  400: 'Bad Request',
  401: 'API KEY ERROR',
  403: 'Server Refused to Access',
  429: 'Request frequency is too high. Please try again later.',
  502: 'Gateway error. Please try again later.',
  503: 'The server is busy. Please try again later.',
  504: 'Gateway timeout. Please try again later.',
  500: 'The server is busy. Please try again later.',
};

export const LLM_NAMESPACE = 'llm';
export const LLM_COMPLETION_TOOL = 'completions';
export const LLM_CHAT_COMPLETION_TOOL = 'chat_completions';
export const LLM_GENERATE_TEXT_TOOL = 'generate_text';

@Controller('/llm-tool')
@ApiTags('大语言模型')
export class LlmController {
  constructor(private readonly service: LlmService) {}

  @Get('/manifest.json')
  @ApiExcludeEndpoint()
  public getMetadata(): ManifestJson {
    return {
      schema_version: SchemaVersion.v1,
      display_name: '大语言模型',
      namespace: LLM_NAMESPACE,
      auth: {
        type: AuthType.none,
      },
      api: {
        type: ApiType.openapi,
        url: `${CHAT_TOOL_OPENAPI_PATH}-json`,
      },
      contact_email: 'dev@inf-monkeys.com',
    };
  }

  @Get('/models')
  @ApiOperation({
    summary: '获取所有模型',
    description: '获取所有模型',
  })
  public async getModels() {
    return getModels();
  }

  @Post('/completions')
  @ApiOperation({
    summary: '文本补全',
    description: '文本补全',
  })
  @MonkeyToolName(LLM_COMPLETION_TOOL)
  @MonkeyToolDisplayName({
    'zh-CN': '单轮对话（大语言模型）',
    'en-US': 'Completions (LLM)',
  })
  @MonkeyToolDescription({
    'zh-CN': '大语言模型单轮对话（文本补全）接口',
    'en-US': 'Completions (LLM)',
  })
  @MonkeyToolCategories(['gen-text'])
  @MonkeyToolIcon('emoji:💬:#c15048')
  @MonkeyToolInput([MODEL_PROPERTY, USER_MESSAGE_PROPERTY, MAX_TOKEN_PROPERTY, TEMPERATURE_PROPERTY, PRESENCE_PENALTY_PROPERTY, FREQUENCY_PENALTY_PROPERTY, STREAM_PROPERTY])
  @MonkeyToolOutput([
    {
      name: 'id',
      displayName: 'ID',
      type: 'string',
      required: true,
    },
    {
      name: 'object',
      displayName: 'Object',
      type: 'string',
    },
    {
      name: 'created',
      displayName: 'Created',
      type: 'number',
    },
    {
      name: 'model',
      displayName: 'Model',
      type: 'string',
    },
    {
      name: 'choices',
      displayName: 'Choices',
      type: 'json',
      typeOptions: {
        multipleValues: true,
      },
      properties: [
        {
          name: 'index',
          displayName: 'Index',
          type: 'number',
        },
        {
          name: 'text',
          displayName: 'Text',
          type: 'string',
        },
        {
          name: 'logprobs',
          displayName: 'Logprobs',
          type: 'string',
        },
        {
          name: 'finish_reason',
          displayName: 'Finish Reason',
          type: 'string',
        },
      ],
    },
    {
      name: 'usage',
      displayName: 'Usage',
      type: 'json',
      properties: [
        {
          name: 'prompt_tokens',
          displayName: 'Prompt Tokens',
          type: 'number',
        },
        {
          name: 'completion_tokens',
          displayName: 'Completion Tokens',
          type: 'number',
        },
        {
          name: 'total_tokens',
          displayName: 'Total Tokens',
          type: 'number',
        },
      ],
    },
    {
      name: 'system_fingerprint',
      displayName: 'System Fingerprint',
      type: 'string',
    },
  ])
  @MonkeyToolExtra({
    estimateTime: 3,
  })
  /**
   * Example output:
    {
      "id": "chatcmpl-9D55Std9JjsNhUy9LgC6W0JasQzJD",
      "object": "chat.completion",
      "created": 1712904846,
      "model": "gpt-3.5-turbo-0125",
      "choices": [
          {
            "text": "，我現在還在試驗狀",
            "index": 0,
            "logprobs": null,
            "finish_reason": "length"
          }
      ],
      "usage": {
        "prompt_tokens": 8,
        "completion_tokens": 9,
        "total_tokens": 17
      },
      "system_fingerprint": "fp_b28b39ffa8"
    }
   */
  public async createCompletions(@Res() res: Response, @Body() body: CreateCompletionsDto) {
    const { stream = false } = body;
    const answer = await this.service.createCompelitions({
      prompt: body.prompt,
      model: body.model,
      temperature: body.temperature,
      frequency_penalty: body.frequency_penalty,
      presence_penalty: body.presence_penalty,
      stream,
      max_tokens: body.max_tokens,
    });
    if (answer instanceof Error) {
      let status = 500;
      let errorMessage = ErrorMessage['500'];
      Object.keys(ErrorMessage).forEach((key: string) => {
        if (answer.message.includes(key)) {
          status = parseInt(key, 10);
          errorMessage = ErrorMessage[key];
        }
      });
      return res.status(status).send(errorMessage);
    } else if (stream) {
      res.setHeader('content-type', answer.headers['content-type']);
      res.status(200);
      answer.data.on('data', (chunk: any) => {
        res.write(chunk);
      });
      answer.data.on('end', () => {
        res.end();
      });
      answer.data.on('error', () => {
        res.end();
      });
    } else {
      res.status(200).send(answer.data);
    }
  }

  @Post('/chat/generate-text')
  @ApiOperation({
    summary: '文本生成',
    description: '文本生成',
  })
  @MonkeyToolName(LLM_GENERATE_TEXT_TOOL)
  @MonkeyToolDisplayName({
    'zh-CN': '文本生成（大语言模型）',
    'en-US': 'Generate Text (LLM)',
  })
  @MonkeyToolDescription({
    'zh-CN': '大语言模型文本生成',
    'en-US': 'Generate Text (LLM)',
  })
  @MonkeyToolCategories(['gen-text'])
  @MonkeyToolIcon('emoji:💬:#c15048')
  @MonkeyToolInput([
    MODEL_PROPERTY,
    SYSTEM_PROMOT_PROPERTY,
    USER_MESSAGE_PROPERTY,
    KNOWLEDGE_BASE_PROPERTY,
    TOOLS_PROPERTY,
    MAX_TOKEN_PROPERTY,
    TEMPERATURE_PROPERTY,
    PRESENCE_PENALTY_PROPERTY,
    FREQUENCY_PENALTY_PROPERTY,
    RESPONSE_FORMAT_PROPERTY,
  ])
  @MonkeyToolOutput([
    {
      name: 'message',
      displayName: {
        'zh-CN': '消息',
        'en-US': 'Message',
      },
      type: 'string',
      required: true,
    },
    {
      name: 'usage',
      displayName: 'Token Usage',
      type: 'json',
      properties: [
        {
          name: 'prompt_tokens',
          displayName: 'Prompt Tokens',
          type: 'number',
        },
        {
          name: 'completion_tokens',
          displayName: 'Completion Tokens',
          type: 'number',
        },
        {
          name: 'total_tokens',
          displayName: 'Total Tokens',
          type: 'number',
        },
      ],
    },
  ])
  @MonkeyToolExtra({
    estimateTime: 3,
  })
  public async generateTextByLlm(@Res() res: Response, @Body() body: GenerateTextByLlmDto) {
    if (!body.userMessage) {
      return res.status(400).send('userMessage is required');
    }
    await this.service.createChatCompelitions(
      res,
      {
        messages: [
          {
            role: 'user',
            content: body.userMessage,
          },
        ],
        model: body.model,
        temperature: body.temperature,
        frequency_penalty: body.frequency_penalty,
        presence_penalty: body.presence_penalty,
        stream: false,
        systemPrompt: body.systemPrompt,
        tools: body.tools,
        knowledgeBase: body.knowledgeBase,
        response_format: body.response_format,
      },
      {
        apiResponseType: 'simple',
      },
    );
  }

  @Post('/chat/completions')
  @ApiOperation({
    summary: '多轮对话',
    description: '多轮对话',
  })
  @MonkeyToolName(LLM_CHAT_COMPLETION_TOOL)
  @MonkeyToolDisplayName({
    'zh-CN': '多轮对话（大语言模型）',
    'en-US': 'Chat Completions (LLM)',
  })
  @MonkeyToolDescription({
    'zh-CN': '大语言模型多轮对话',
    'en-US': 'Chat Completions (LLM)',
  })
  @MonkeyToolCategories(['gen-text'])
  @MonkeyToolIcon('emoji:💬:#c15048')
  @MonkeyToolInput([
    MODEL_PROPERTY,
    SYSTEM_PROMOT_PROPERTY,
    {
      displayName: {
        'zh-CN': '历史会话记录',
        'en-US': 'Messages',
      },
      name: 'messages',
      type: 'json',
      required: true,
    },
    KNOWLEDGE_BASE_PROPERTY,
    SQL_KNOWLEDGE_BASE_PROPERTY,
    TOOLS_PROPERTY,
    MAX_TOKEN_PROPERTY,
    TEMPERATURE_PROPERTY,
    PRESENCE_PENALTY_PROPERTY,
    FREQUENCY_PENALTY_PROPERTY,
    RESPONSE_FORMAT_PROPERTY,
    STREAM_PROPERTY,
    {
      name: 'show_logs',
      displayName: {
        'zh-CN': '是否显示日志',
        'en-US': 'Show Logs',
      },
      type: 'boolean',
      required: false,
      default: false,
    },
  ])
  @MonkeyToolOutput([
    {
      name: 'id',
      displayName: 'ID',
      type: 'string',
      required: true,
    },
    {
      name: 'object',
      displayName: 'Object',
      type: 'string',
    },
    {
      name: 'created',
      displayName: 'Created',
      type: 'number',
    },
    {
      name: 'model',
      displayName: 'Model',
      type: 'string',
    },
    {
      name: 'choices',
      displayName: 'Choices',
      type: 'json',
      typeOptions: {
        multipleValues: true,
      },
      properties: [
        {
          name: 'index',
          displayName: 'Index',
          type: 'number',
        },
        {
          name: 'message',
          displayName: 'Message',
          type: 'json',
          properties: [
            {
              name: 'role',
              displayName: 'Role',
              type: 'string',
            },
            {
              name: 'content',
              displayName: 'Content',
              type: 'string',
            },
          ],
        },
        {
          name: 'logprobs',
          displayName: 'Logprobs',
          type: 'string',
        },
        {
          name: 'finish_reason',
          displayName: 'Finish Reason',
          type: 'string',
        },
      ],
    },
    {
      name: 'usage',
      displayName: 'Usage',
      type: 'json',
      properties: [
        {
          name: 'prompt_tokens',
          displayName: 'Prompt Tokens',
          type: 'number',
        },
        {
          name: 'completion_tokens',
          displayName: 'Completion Tokens',
          type: 'number',
        },
        {
          name: 'total_tokens',
          displayName: 'Total Tokens',
          type: 'number',
        },
      ],
    },
    {
      name: 'system_fingerprint',
      displayName: 'System Fingerprint',
      type: 'string',
    },
  ])
  @MonkeyToolExtra({
    estimateTime: 3,
  })
  /**
   * Example output:
    {
      "id": "chatcmpl-9D55Std9JjsNhUy9LgC6W0JasQzJD",
      "object": "chat.completion",
      "created": 1712904846,
      "model": "gpt-3.5-turbo-0125",
      "choices": [
        {
          "index": 0,
          "message": {
            "role": "assistant",
            "content": "Hello! How can I assist you today?"
          },
          "logprobs": null,
          "finish_reason": "stop"
        }
      ],
      "usage": {
        "prompt_tokens": 8,
        "completion_tokens": 9,
        "total_tokens": 17
      },
      "system_fingerprint": "fp_b28b39ffa8"
    }
   */
  public async createChatCompletions(@Res() res: Response, @Body() body: CreateChatCompletionsDto) {
    const { stream = false, show_logs = false } = body;
    await this.service.createChatCompelitions(
      res,
      {
        messages: body.messages,
        model: body.model,
        temperature: body.temperature,
        frequency_penalty: body.frequency_penalty,
        presence_penalty: body.presence_penalty,
        stream,
        systemPrompt: body.systemPrompt,
        tools: body.tools,
        knowledgeBase: body.knowledgeBase,
        sqlKnowledgeBase: body.sqlKnowledgeBase,
        response_format: body.response_format,
      },
      {
        apiResponseType: 'full',
        showLogs: show_logs,
      },
    );
  }
}
