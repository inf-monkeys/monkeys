import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { IRequest } from '@/common/typings/request';
import { All, Body, Controller, Param, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { WorkflowWebhookService } from './workflow.webhook.service';

@Controller('workflow')
@ApiTags('Workflows/Webhook')
@UseGuards(CompatibleAuthGuard)
export class WorkflowWebhookController {
  constructor(private readonly service: WorkflowWebhookService) {}

  @All('/webhook/:webhookPath')
  @ApiOperation({
    summary: '通过 Webhook 触发工作流',
    description: '通过 Webhook 触发工作流',
  })
  public async triggerWorkflowByWebhook(@Param('webhookPath') webhookPath: string, @Res() res: Response, @Req() req: IRequest, @Query() query: any, @Body() body: any) {
    const [statusCode, data] = await this.service.triggerWorkflowByWebhook(webhookPath, req, query, body);
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
