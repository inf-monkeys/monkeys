import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { WorkflowLogService } from './workflow.log.service';

@ApiTags('Workflows/Logs')
@Controller('/workflow/logs')
export class WorkflowLogsController {
  constructor(private readonly logService: WorkflowLogService) {}

  @Get('/:taskId')
  public async getLogs(@Param('taskId') taskId: string, @Res() res: Response) {
    await this.logService.getLogs(res, taskId);
  }
}
