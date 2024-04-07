import { Body, Controller, Param, Post, Res } from '@nestjs/common';
import { ApiExcludeController, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { WorkflowCustomTriggerInvokeService } from './workflow.custom-trigger-invoke.service';

@Controller('/internal/triggers/')
@ApiExcludeController()
export class WorkflowCustomTriggerInvokeController {
  constructor(private readonly service: WorkflowCustomTriggerInvokeService) {}

  @Post('/:triggerId/invoke')
  @ApiOperation({
    summary: '自定义触发器触发工作流',
    description: '自定义触发器触发工作流',
  })
  public async createTrigger(@Res() res: Response, @Param('triggerId') triggerId: string, @Body() dto: any) {
    const [statusCode, data] = await this.service.triggerWorkflow(triggerId, dto);
    if (statusCode !== 200) {
      return res.status(statusCode).json({
        statusCode: statusCode,
        message: data,
      });
    } else {
      return res.status(statusCode).json(data);
    }
  }
}
