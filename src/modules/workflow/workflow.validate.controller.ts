import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { ValidationIssueType } from '@/database/entities/workflow/workflow-metadata';
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ValidateWorkflowDto } from './dto/req/validate-workflow.dto';
import { WorkflowCrudService } from './workflow.curd.service';
import { WorkflowValidateService } from './workflow.validate.service';

@Controller('workflow')
@ApiTags('Workflows/Validation')
@UseGuards(CompatibleAuthGuard)
export class WorkflowValidateController {
  constructor(
    private readonly service: WorkflowValidateService,
    private readonly workflowCrudService: WorkflowCrudService,
  ) {}

  @Post('/validate')
  @ApiOperation({
    summary: '校验 workflow',
    description: '校验 workflow',
  })
  public async validateWorkflow(@Req() req: IRequest, @Body() body: ValidateWorkflowDto) {
    const { teamId } = req;
    const { tasks, output = [], workflowId, workflowVersion = 1 } = body;
    await this.workflowCrudService.getWorkflowDef(workflowId, workflowVersion);
    const validationIssues = await this.service.validateWorkflow(teamId, tasks, output);
    const errors = validationIssues.filter((i) => i.issueType === ValidationIssueType.ERROR);
    const validated = errors.length === 0;
    await this.workflowCrudService.updateWorkflowDef(teamId, workflowId, workflowVersion, {
      validationIssues,
    });

    return new SuccessResponse({
      data: {
        validated,
        validationIssues,
      },
    });
  }
}
