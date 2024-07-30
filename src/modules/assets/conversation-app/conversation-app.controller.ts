import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { CreateConversationAppParams, UpdateConversationAppParams } from '@/database/entities/conversation-app/conversation-app.entity';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { json2csv } from 'json-2-csv';
import { ConversationAppService } from './conversation-app.service';
import { ConversationStatisticsService } from './conversation-app.statstics.service';

@Controller('/conversation-apps')
@UseGuards(CompatibleAuthGuard)
export class ConversationAppController {
  constructor(
    private readonly service: ConversationAppService,
    private readonly statisticsService: ConversationStatisticsService,
  ) {}

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

  @Get('/statistics')
  public async getExecutionStatisticsByTeamId(
    @Req() req: IRequest,
    @Res() res: Response,
    @Query('startTimestamp') createdTimestampStr: string,
    @Query('endTimestamp') endTimestampStr: string,
    @Query('format') format: string = 'json',
  ) {
    const data = await this.statisticsService.getExecutionStatisticsByTeamId(req.teamId, createdTimestampStr, endTimestampStr);
    if (format === 'csv') {
      try {
        const csv = json2csv(data);
        res.header('Content-Type', 'text/csv');
        res.attachment('data.csv');
        res.header('Content-Disposition', 'attachment; filename=data.csv');
        res.send(csv);
      } catch (error) {
        res.status(500).send('Error generating CSV');
      }
    } else if (format === 'json') {
      return res.json(new SuccessResponse({ data }));
    } else {
      throw new Error('Invalid format');
    }
  }

  @Get('/:id/statistics')
  public async getWorkflowStatistics(
    @Req() req: IRequest,
    @Res() res: Response,
    @Param('id') appId: string,
    @Query('startTimestamp') createdTimestampStr: string,
    @Query('endTimestamp') endTimestampStr: string,
    @Query('format') format: string = 'json',
  ) {
    const app = await this.service.getConversationAppById(req.teamId, appId);
    if (!app) {
      throw new Error('Conversation app not found');
    }
    const data = await this.statisticsService.getExecutionStatisticsByAppId(appId, createdTimestampStr, endTimestampStr);
    if (format === 'csv') {
      try {
        const csv = json2csv(data);
        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename=data.csv');
        res.attachment('data.csv');
        res.send(csv);
      } catch (error) {
        res.status(500).send('Error generating CSV');
      }
    } else if (format === 'json') {
      return res.json(new SuccessResponse({ data }));
    } else {
      throw new Error('Invalid format');
    }
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
