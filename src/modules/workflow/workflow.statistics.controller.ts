import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Controller, Get, Param, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { json2csv } from 'json-2-csv';
import { WorkflowStatisticsService } from './workflow.statstics.service';

@Controller('workflow/')
@ApiTags('Workflows/Statistics')
@UseGuards(CompatibleAuthGuard)
export class WorkflowStatisticsController {
  constructor(private readonly workflowStatisticsService: WorkflowStatisticsService) {}

  @Get('/statistics')
  public async getTeamWorkflowStatistics(
    @Req() req: IRequest,
    @Res() res: Response,
    @Query('startTimestamp') createdTimestampStr: string,
    @Query('endTimestamp') endTimestampStr: string,
    @Query('format') format: string = 'json',
  ) {
    const data = await this.workflowStatisticsService.getTeamWorkflowStatistics(req.teamId, createdTimestampStr, endTimestampStr);
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

  @Get('/statistics/:workflowId')
  public async getWorkflowStatistics(
    @Res() res: Response,
    @Param('workflowId') workflowId: string,
    @Query('startTimestamp') createdTimestampStr: string,
    @Query('endTimestamp') endTimestampStr: string,
    @Query('format') format: string = 'json',
  ) {
    const data = await this.workflowStatisticsService.getWorkflowStatistics(workflowId, createdTimestampStr, endTimestampStr);
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
}
