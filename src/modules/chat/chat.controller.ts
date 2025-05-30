import { MQ_TOKEN } from '@/common/common.module';
import { ConversationStatusEnum } from '@/common/dto/status.enum';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { Mq } from '@/common/mq';
import { IRequest } from '@/common/typings/request';
import { isValidObjectId } from '@/common/utils';
import { calculateMd5FromArrayBuffer, extractMarkdownImageUrls, isMarkdown, replaceMarkdownImageUrls } from '@/common/utils/markdown-image-utils';
import { MediaFileEntity } from '@/database/entities/assets/media/media-file';
import { ConversationAppEntity } from '@/database/entities/conversation-app/conversation-app.entity';
import { WorkflowMetadataEntity } from '@/database/entities/workflow/workflow-metadata';
import { WorkflowTriggerType } from '@/database/entities/workflow/workflow-trigger';
import { ConversationAppRepository } from '@/database/repositories/conversation-app.repository';
import { TeamRepository } from '@/database/repositories/team.repository';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import axios from 'axios';
import { Response } from 'express';
import { ChatCompletionMessageParam } from 'openai/resources';
import { MediaFileService } from '../assets/media/media.service';
import { LlmService } from '../tools/llm/llm.service';
import { TOOL_STREAM_RESPONSE_TOPIC } from '../tools/tools.polling.service';
import { WorkflowExecutionService } from '../workflow/workflow.execution.service';
import { ContentPartDto, CreateChatCompletionsDto } from './dto/req/create-chat-compltion.dto';
import { CreateCompletionsDto } from './dto/req/create-compltion.dto';

@Controller('/v1')
@ApiTags('Chat')
@UseGuards(CompatibleAuthGuard)
export class WorkflowOpenAICompatibleController {
  constructor(
    private readonly workflowExecutionService: WorkflowExecutionService,
    private readonly workflowRepository: WorkflowRepository,
    private readonly conversationAppRepository: ConversationAppRepository,
    private readonly teamRepository: TeamRepository,
    @Inject(MQ_TOKEN) private readonly mq: Mq,
    private readonly llmService: LlmService,
    private readonly mediaFileService: MediaFileService,
  ) {}

  @Get('/models')
  @ApiOperation({
    summary: 'List models',
    description: 'List models',
  })
  public async listModels(@Req() req: IRequest) {
    const { teamId } = req;
    const openaiCompatibleWorkflows = await this.workflowRepository.listAllOpenAICompatibleWorkflows(teamId);
    const team = await this.teamRepository.getTeamById(teamId);
    return {
      object: 'list',
      data: openaiCompatibleWorkflows.map((workflow) => ({
        id: workflow.openaiModelName || workflow.workflowId,
        object: 'model',
        created: Math.floor(workflow.createdTimestamp / 1000),
        owned_by: team.name,
      })),
    };
  }

  private async getWorkflowOrConversationAppByModel(
    teamId: string,
    model: string,
  ): Promise<{
    found: boolean;
    type?: 'conversation-app' | 'workflow';
    data?: ConversationAppEntity | WorkflowMetadataEntity;
  }> {
    if (isValidObjectId(model)) {
      const workflow = await this.workflowRepository.getWorkflowByIdWithoutVersion(model, false);
      if (workflow) {
        return { found: true, type: 'workflow', data: workflow };
      }
      const conversationApp = await this.conversationAppRepository.getConversationAppById(teamId, model);
      if (conversationApp) {
        return { found: true, type: 'conversation-app', data: conversationApp };
      }
      return { found: false };
    } else {
      const workflow = await this.workflowRepository.findWorkflowByOpenAIModelName(teamId, model);
      if (workflow) {
        return { found: true, type: 'workflow', data: workflow };
      }
      const conversationApp = await this.conversationAppRepository.getConversationAppByCustomModelName(teamId, model);
      if (conversationApp) {
        return { found: true, type: 'conversation-app', data: conversationApp };
      }
      return { found: false };
    }
  }

  private convertToOpenAIMessages(
    messages: Array<{
      role: string;
      content: string | Array<ContentPartDto>;
      name?: string;
    }>,
  ): Array<ChatCompletionMessageParam> {
    return messages.map((message) => {
      if (typeof message.content === 'string') {
        return {
          role: message.role as any,
          content: message.content,
          name: message.name,
        } as ChatCompletionMessageParam;
      } else if (Array.isArray(message.content)) {
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

      return {
        role: message.role as any,
        content: '',
        name: message.name,
      } as ChatCompletionMessageParam;
    });
  }

  @Post('/completions')
  @ApiOperation({
    summary: 'Create completions',
    description: 'Create completions',
  })
  @HttpCode(200)
  public async createcCompletions(@Req() req: IRequest, @Body() body: CreateCompletionsDto, @Res() res: Response) {
    const { teamId, userId, apikey } = req;
    const { model, stream = false } = body;
    const { found, data, type } = await this.getWorkflowOrConversationAppByModel(teamId, model);
    if (!found) {
      return res.status(404).json({ message: 'Model not found' });
    }
    if (type === 'conversation-app') {
      throw new Error('Compeletion Mode is not supported in Conversation app');
    }
    const { workflowId } = data as WorkflowMetadataEntity;
    const sessionId = (req.headers['x-monkeys-session-id'] as string) || 'default';
    const workflowInstanceId = await this.workflowExecutionService.startWorkflow({
      teamId,
      userId,
      workflowId,
      inputData: body,
      triggerType: WorkflowTriggerType.API,
      chatSessionId: sessionId,
      apiKey: apikey,
    });
    if (stream === false) {
      const result = await this.workflowExecutionService.waitForWorkflowResult(teamId, workflowInstanceId);
      let content = result.output;
      if (isMarkdown(content)) content = await this.llmService.replaceMarkdownImageUrls(content, teamId, userId);
      result.output = content;
      return res.status(200).json(result);
    } else {
      res.setHeader('content-type', 'text/event-stream');
      res.status(200);
      const key = TOOL_STREAM_RESPONSE_TOPIC(workflowInstanceId);
      this.mq.subscribe(key, (_, message: string) => {
        res.write(message);
        if (message.includes('[DONE]')) {
          res.end();
        }
      });
    }
  }

  @Post('/chat/completions')
  @ApiOperation({
    summary: 'Create chat completions',
    description: 'Create chat completions',
  })
  @HttpCode(200)
  public async createChatComplitions(@Req() req: IRequest, @Body() body: CreateChatCompletionsDto, @Res() res: Response) {
    const { teamId, userId, apikey } = req;
    const { model, stream = false } = body;
    const { found, data, type } = await this.getWorkflowOrConversationAppByModel(teamId, model);
    if (!found) {
      return res.status(404).json({ message: 'Model not found' });
    }
    const conversationId = req.headers['x-monkeys-conversation-id'] as string;
    if (type === 'workflow') {
      const { workflowId } = data as WorkflowMetadataEntity;
      const workflowInstanceId = await this.workflowExecutionService.startWorkflow({
        teamId,
        userId,
        workflowId,
        inputData: body,
        triggerType: WorkflowTriggerType.API,
        chatSessionId: conversationId,
        apiKey: apikey,
      });
      if (conversationId) {
        const openAIMessages = this.convertToOpenAIMessages(body.messages);
        await this.workflowRepository.updateChatSessionMessages(teamId, conversationId, openAIMessages);
      }
      if (stream === false) {
        const result = await this.workflowExecutionService.waitForWorkflowResult(teamId, workflowInstanceId);
        const aiResponse = (result?.choices || [])[0]?.message?.content;
        let finalResponse = aiResponse;
        const markdown = aiResponse;
        const imageLinks = extractMarkdownImageUrls(markdown);
        const replaceMap = new Map<string, string>();
        if (imageLinks.length > 0) {
          const promises = imageLinks.map(async (url) => {
            try {
              const image = await axios.get(url, { responseType: 'arraybuffer' });
              const md5 = await calculateMd5FromArrayBuffer(image.data);
              const data = await this.mediaFileService.getMediaByMd5(teamId, md5);
              if (!data) {
                try {
                  const createdData = await this.mediaFileService.createMedia(teamId, userId, {
                    type: 'image',
                    displayName: url,
                    url: url,
                    source: 1,
                    params: {
                      url: url,
                    },
                    size: image.data.byteLength,
                  });

                  replaceMap.set(url, (createdData as MediaFileEntity).url);
                } catch (error) {}
              } else {
                replaceMap.set(url, data.url);
              }
            } catch (e) {}
          });
          await Promise.all(promises);
          finalResponse = replaceMarkdownImageUrls(markdown, replaceMap);
          const newMessages = body.messages.concat({ role: 'assistant', content: finalResponse });
          if (conversationId) {
            const openAIMessages = this.convertToOpenAIMessages(newMessages);
            await this.workflowRepository.updateChatSessionMessages(teamId, conversationId, openAIMessages);
          }
        }
        return res.status(200).json(result);
      } else {
        res.setHeader('content-type', 'text/event-stream');
        res.status(200);
        const channel = TOOL_STREAM_RESPONSE_TOPIC(workflowInstanceId);
        let aiResponse = '';
        this.mq.subscribe(channel, (channel, message: string) => {
          res.write(message);
          if (message.startsWith('data: [DONE]')) {
            const newMessages = body.messages.concat({ role: 'assistant', content: aiResponse });
            if (conversationId) {
              const openAIMessages = this.convertToOpenAIMessages(newMessages);
              this.workflowRepository.updateChatSessionMessages(teamId, conversationId, openAIMessages);
            }
            this.mq.unsubscribe(channel);
            res.end();
          } else {
            const cleanedMessageStr = message.replace('data: ', '').trim();
            try {
              const parsedMessage = JSON.parse(cleanedMessageStr);
              const { choices = [] } = parsedMessage;
              const content = choices[0]?.delta?.content;
              if (content) {
                aiResponse += content;
              }
            } catch (error) {}
          }
        });
      }
    } else if (type === 'conversation-app') {
      const conversationApp = data as ConversationAppEntity;
      const start = +new Date();
      const onSuccess = async (text: string) => {
        if (conversationId) {
          const end = +new Date();
          let result = text;
          const markdown = text;
          const imageLinks = extractMarkdownImageUrls(markdown);
          const replaceMap = new Map<string, string>();
          if (imageLinks.length > 0) {
            const promises = imageLinks.map(async (url) => {
              try {
                const image = await axios.get(url, { responseType: 'arraybuffer' });
                const md5 = await calculateMd5FromArrayBuffer(image.data);
                const data = await this.mediaFileService.getMediaByMd5(teamId, md5);
                if (!data) {
                  try {
                    const createdData = await this.mediaFileService.createMedia(teamId, userId, {
                      type: 'image',
                      displayName: url,
                      url: url,
                      source: 1,
                      params: {
                        url: url,
                      },
                      size: image.data.byteLength,
                    });

                    replaceMap.set(url, (createdData as MediaFileEntity).url);
                  } catch (error) {}
                } else {
                  replaceMap.set(url, data.url);
                }
              } catch (e) {}
            });
            await Promise.all(promises);
            result = replaceMarkdownImageUrls(markdown, replaceMap);
          }
          const newMessages = body.messages.concat({ role: 'assistant', content: result });
          const openAIMessages = this.convertToOpenAIMessages(newMessages);
          await this.workflowRepository.updateChatSessionMessages(teamId, conversationId, openAIMessages);
          await this.conversationAppRepository.createConversationExecution(userId, conversationApp.id, ConversationStatusEnum.SUCCEED, end - start);
        }
      };
      const onFailed = async () => {
        if (conversationId) {
          const end = +new Date();
          await this.conversationAppRepository.createConversationExecution(userId, conversationApp.id, ConversationStatusEnum.FAILED, end - start);
        }
      };
      await this.llmService.createChatCompelitions(
        res,
        teamId,
        {
          ...body,
          model: conversationApp.model,
          temperature: body.temperature || conversationApp.temperature,
          presence_penalty: body.presence_penalty || conversationApp.presence_penalty,
          frequency_penalty: body.frequency_penalty || conversationApp.frequency_penalty,
          tools: conversationApp.tools || [],
          knowledgeBase: conversationApp.knowledgeBase,
          sqlKnowledgeBase: conversationApp.sqlKnowledgeBase,
          systemPrompt: conversationApp.systemPrompt,
        },
        {
          onSuccess,
          onFailed,
          userId,
        },
      );
    }
  }
}
