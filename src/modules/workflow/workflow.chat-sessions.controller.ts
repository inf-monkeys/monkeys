import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { CreateChatSessionDto, UpdateChatSessionDto } from '@inf-monkeys/vines';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import _ from 'lodash';
import { ListChatSessionsDto } from './dto/req/list-chat-sessions.dto';
import { WorkflowChatSessionService } from './workflow.chat-sessions.service';

@Controller('/chat-sessions')
@ApiTags('Workflow/Chat Sessions')
@UseGuards(CompatibleAuthGuard)
export class WorkflowChatSessionController {
  constructor(private readonly service: WorkflowChatSessionService) {}

  @Post()
  public async createChatSession(@Req() req: IRequest, @Body() dto: CreateChatSessionDto) {
    const { workflowId, displayName } = dto;
    const { userId, teamId } = req;
    const data = await this.service.createChatSession(teamId, userId, workflowId, displayName);
    return new SuccessResponse({
      data,
    });
  }

  @Get()
  public async listChatSessions(@Req() req: IRequest, @Query() dto: ListChatSessionsDto) {
    const { workflowId } = dto;
    const { teamId } = req;
    const data = await this.service.listChatSessions(teamId, workflowId);
    return new SuccessResponse({
      data,
    });
  }

  @Delete('/:sessionId')
  public async deleteChatSession(@Req() req: IRequest, @Param('sessionId') sessionId: string) {
    const { teamId } = req;
    const data = await this.service.deleteChatSession(teamId, sessionId);
    return new SuccessResponse({
      data,
    });
  }

  @Put('/:sessionId')
  public async updateChatSession(@Req() req: IRequest, @Param('sessionId') sessionId: string, @Body() dto: UpdateChatSessionDto) {
    const { displayName } = dto;
    const { teamId } = req;
    const $set = _.pickBy({
      displayName,
      updatedTimestamp: Date.now(),
    });
    const data = await this.service.updateChatSession(teamId, sessionId, $set);
    return new SuccessResponse({
      data,
    });
  }
}
