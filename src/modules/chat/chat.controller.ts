import { MQ_TOKEN } from '@/common/common.module';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { Mq } from '@/common/mq';
import { IRequest } from '@/common/typings/request';
import { WorkflowTriggerType } from '@/database/entities/workflow/workflow-trigger';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { Body, Controller, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { TOOL_STREAM_RESPONSE_TOPIC } from '../tools/tools.polling.service';
import { WorkflowExecutionService } from '../workflow/workflow.execution.service';
import { CreateChatCompletionsDto } from './dto/req/create-chat-compltion.dto';
import { CreateCompletionsDto } from './dto/req/create-compltion.dto';

@Controller('/')
@ApiTags('Chat')
@UseGuards(CompatibleAuthGuard)
export class WorkflowOpenAICompatibleController {
  constructor(
    private readonly workflowExecutionService: WorkflowExecutionService,
    private readonly workflowRepository: WorkflowRepository,
    @Inject(MQ_TOKEN) private readonly mq: Mq,
  ) {}

  @Post('/completions')
  public async createcCompletions(@Req() req: IRequest, @Body() body: CreateCompletionsDto, @Res() res: Response) {
    const { teamId, userId } = req;
    const { model: workflowId, stream = false } = body;
    const sessionId = (req.headers['x-monkeys-session-id'] as string) || 'default';
    if (stream && !this.mq.canuse) {
      throw new Error('Stream output is not supported without redis');
    }
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
      res.status(201);
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
  public async createChatComplitions(@Req() req: IRequest, @Body() body: CreateChatCompletionsDto, @Res() res: Response) {
    const { teamId, userId } = req;
    const { model: workflowId, stream = false } = body;
    const conversationId = req.headers['x-monkeys-conversation-id'] as string;
    if (stream && !this.mq.canuse) {
      throw new Error('Stream output is not supported without redis');
    }
    const workflowInstanceId = await this.workflowExecutionService.startWorkflow({
      teamId,
      userId,
      workflowId,
      inputData: body,
      triggerType: WorkflowTriggerType.API,
      chatSessionId: conversationId,
    });
    if (conversationId) {
      await this.workflowRepository.updateChatSessionMessages(workflowInstanceId, conversationId, body.messages);
    }
    if (stream === false) {
      const result = await this.workflowExecutionService.waitForWorkflowResult(teamId, workflowInstanceId);
      return res.json(result);
    } else {
      res.setHeader('content-type', 'text/event-stream');
      res.status(201);
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
}
