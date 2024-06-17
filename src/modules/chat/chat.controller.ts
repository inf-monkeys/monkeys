import { MQ_TOKEN } from '@/common/common.module';
import { config } from '@/common/config';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { logger } from '@/common/logger';
import { Mq } from '@/common/mq';
import { IRequest } from '@/common/typings/request';
import { isValidObjectId } from '@/common/utils';
import { WorkflowTriggerType } from '@/database/entities/workflow/workflow-trigger';
import { TeamRepository } from '@/database/repositories/team.repository';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { Body, Controller, Get, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { TOOL_STREAM_RESPONSE_TOPIC } from '../tools/tools.polling.service';
import { WorkflowExecutionService } from '../workflow/workflow.execution.service';
import { CreateChatCompletionsDto } from './dto/req/create-chat-compltion.dto';
import { CreateCompletionsDto } from './dto/req/create-compltion.dto';

@Controller('/v1')
@ApiTags('Chat')
@UseGuards(CompatibleAuthGuard)
export class WorkflowOpenAICompatibleController {
  constructor(
    private readonly workflowExecutionService: WorkflowExecutionService,
    private readonly workflowRepository: WorkflowRepository,
    private readonly teamRepository: TeamRepository,
    @Inject(MQ_TOKEN) private readonly mq: Mq,
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

  private async getWorkflowIdByModel(teamId: string, model: string) {
    let workflowId;
    if (isValidObjectId(model)) {
      workflowId = model;
    } else {
      const workflow = await this.workflowRepository.findWorkflowByOpenAIModelName(teamId, model);
      if (!workflow) {
        return null;
      }
      workflowId = workflow.workflowId;
    }
    return workflowId;
  }

  @Post('/completions')
  @ApiOperation({
    summary: 'Create completions',
    description: 'Create completions',
  })
  public async createcCompletions(@Req() req: IRequest, @Body() body: CreateCompletionsDto, @Res() res: Response) {
    const { teamId, userId } = req;
    const { model, stream = false } = body;
    const workflowId = await this.getWorkflowIdByModel(teamId, model);
    if (!workflowId) {
      return res.status(404).json({ message: 'Model not found' });
    }

    const sessionId = (req.headers['x-monkeys-session-id'] as string) || 'default';
    const workflowInstanceId = await this.workflowExecutionService.startWorkflow({
      teamId,
      userId,
      workflowId,
      inputData: body,
      triggerType: WorkflowTriggerType.API,
      chatSessionId: sessionId,
    });
    if (stream === false) {
      const result = await this.workflowExecutionService.waitForWorkflowResult(teamId, workflowInstanceId);
      return res.json(result);
    } else {
      res.setHeader('content-type', 'text/event-stream');
      res.status(200);
      const key = TOOL_STREAM_RESPONSE_TOPIC(workflowInstanceId);
      this.mq.subscribe(key, (_, message: string) => {
        res.write(message);
        // TODO: listen on workflow finished event
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
  public async createChatComplitions(@Req() req: IRequest, @Body() body: CreateChatCompletionsDto, @Res() res: Response) {
    const { teamId, userId } = req;
    const { model, stream = false } = body;
    const workflowId = await this.getWorkflowIdByModel(teamId, model);
    if (!workflowId) {
      return res.status(404).json({ message: 'Model not found' });
    }

    const conversationId = req.headers['x-monkeys-conversation-id'] as string;
    const workflowInstanceId = await this.workflowExecutionService.startWorkflow({
      teamId,
      userId,
      workflowId,
      inputData: body,
      triggerType: WorkflowTriggerType.API,
      chatSessionId: conversationId,
    });
    if (conversationId) {
      await this.workflowRepository.updateChatSessionMessages(teamId, conversationId, body.messages);
    }
    if (stream === false) {
      const result = await this.workflowExecutionService.waitForWorkflowResult(teamId, workflowInstanceId);
      const aiResponse = (result?.choices || [])[0]?.message?.content;
      if (aiResponse) {
        const newMessages = body.messages.concat({ role: 'assistant', content: aiResponse });
        if (conversationId) {
          await this.workflowRepository.updateChatSessionMessages(teamId, conversationId, newMessages);
        }
      }
      return res.json(result);
    } else {
      res.setHeader('content-type', 'text/event-stream');
      res.status(200);
      const channel = TOOL_STREAM_RESPONSE_TOPIC(workflowInstanceId);
      let aiResponse = '';
      this.mq.subscribe(channel, (channel, message: string) => {
        logger.info(`[Chat] appId=${config.server.appId}, channel=${channel}, teamId=${teamId}, model=${model}, workflowInstanceId=${workflowInstanceId} message=${message}`);
        res.write(message);
        // TODO: listen on workflow finished event
        if (message.startsWith('data: [DONE]')) {
          const newMessages = body.messages.concat({ role: 'assistant', content: aiResponse });
          if (conversationId) {
            this.workflowRepository.updateChatSessionMessages(teamId, conversationId, newMessages);
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
  }
}
