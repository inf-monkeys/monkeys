import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { CreateConversationAppParams, UpdateConversationAppParams } from '@/database/entities/conversation-app/conversation-app.entity';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ConversationAppService } from './conversation-app.service';

@Controller('/conversation-apps')
@UseGuards(CompatibleAuthGuard)
export class ConversationAppController {
  constructor(private readonly service: ConversationAppService) {}

  @Get('')
  public async listConversationApps(@Req() req: IRequest, @Query() dto: ListDto) {
    const { teamId } = req;
    const { list, totalCount } = await this.service.listConversationApps(teamId, dto);
    return new SuccessListResponse({
      data: list,
      total: totalCount,
      page: dto.page,
      limit: dto.limit,
    });
  }

  @Post('')
  public async createConversationApp(@Req() req: IRequest, @Body() body: CreateConversationAppParams) {
    const { teamId, userId } = req;
    const data = await this.service.createConversationApp(teamId, userId, body);
    return new SuccessResponse({
      data,
    });
  }

  @Get(':id')
  public async getConversationAppById(@Req() req: IRequest, @Param('id') id: string) {
    const { teamId } = req;
    const data = await this.service.getConversationAppById(teamId, id);
    return new SuccessResponse({
      data,
    });
  }

  @Put(':id')
  public async updateConversationApp(@Req() req: IRequest, @Param('id') knowledgeBaseId: string, @Body() body: UpdateConversationAppParams) {
    const { teamId } = req;
    const data = await this.service.updateConversationApp(teamId, knowledgeBaseId, body);
    return new SuccessResponse({
      data,
    });
  }

  @Delete(':id')
  public async deleteConversationApp(@Req() req: IRequest, @Param('id') id: string) {
    const { teamId } = req;
    await this.service.deleteConversationApp(teamId, id);
    return new SuccessResponse();
  }
}
