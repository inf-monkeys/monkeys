import { MQ_TOKEN } from '@/common/common.module';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { Mq } from '@/common/mq';
import { IRequest } from '@/common/typings/request';
import { WorkflowTriggerType } from '@/database/entities/workflow/workflow-trigger';
import { Body, Controller, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { TOOL_STREAM_RESPONSE_TOPIC } from '../tools/tools.polling.service';
import { ChatCompletionsDto } from './dto/req/chat-compltion.dto';
import { WorkflowExecutionService } from './workflow.execution.service';

@Controller('/')
@ApiTags('Chat')
@UseGuards(CompatibleAuthGuard)
export class WorkflowOpenAICompatibleController {
  constructor(
    private readonly workflowExecutionService: WorkflowExecutionService,
    @Inject(MQ_TOKEN) private readonly mq: Mq,
  ) {}

  @Post('/chat/completions')
  public async chatComplitions(@Req() req: IRequest, @Body() body: ChatCompletionsDto, @Res() res: Response) {
    const { teamId, userId } = req;
    const { model: workflowId, stream = false } = body;
    if (stream && !this.mq.canuse) {
      throw new Error('Stream output is not supported without redis');
    }
    const workflowInstanceId = await this.workflowExecutionService.startWorkflow({
      teamId,
      userId,
      workflowId,
      inputData: {
        messages: body.messages,
        temperature: body.temperature,
        frequency_penalty: body.frequency_penalty,
        presence_penalty: body.presence_penalty,
        stream: body.stream,
      },
      triggerType: WorkflowTriggerType.API,
    });

    if (stream === false) {
      const result = await this.workflowExecutionService.waitForWorkflowResult(teamId, workflowInstanceId);
      return res.json(result);
    } else {
      res.setHeader('content-type', 'text/event-stream');
      res.status(201);
      const key = TOOL_STREAM_RESPONSE_TOPIC(workflowInstanceId);
      this.mq.subscribe(key, (_, message: string) => {
        console.log(message);
        res.write(message);
      });
      // TODO: listen on workflow finished event
    }
  }
}
