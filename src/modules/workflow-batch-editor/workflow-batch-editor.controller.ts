import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WorkflowBatchEditorService } from './workflow-batch-editor.service';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { IRequest } from '@/common/typings/request';
import {
  BatchRenameDto,
  BatchRenameResultDto,
} from './dto/batch-rename.dto';
import {
  BatchUpdateParametersDto,
  BatchUpdateParametersResultDto,
} from './dto/batch-update-params.dto';
import {
  AiAssistedBatchEditDto,
  AiAssistedBatchEditResultDto,
} from './dto/ai-assisted-edit.dto';

/**
 * 工作流批量编辑控制器
 * 提供批量重命名、批量修改参数、AI辅助编辑等 API
 */
@ApiTags('Workflow Batch Editor')
@ApiBearerAuth()
@Controller('workflow-batch-editor')
@UseGuards(CompatibleAuthGuard)
export class WorkflowBatchEditorController {
  constructor(private readonly batchEditorService: WorkflowBatchEditorService) {}

  /**
   * 批量重命名工作流
   */
  @Post('batch-rename')
  @ApiOperation({
    summary: '批量重命名工作流',
    description: '根据搜索条件批量重命名工作流的显示名称。支持正则表达式和预览模式。',
  })
  @ApiResponse({
    status: 200,
    description: '批量重命名成功',
    type: BatchRenameResultDto,
  })
  async batchRenameWorkflows(
    @Body() dto: BatchRenameDto,
    @Req() request: IRequest,
  ): Promise<BatchRenameResultDto> {
    return await this.batchEditorService.batchRenameWorkflows(request.teamId, request.userId, dto);
  }

  /**
   * 批量更新工作流参数
   */
  @Post('batch-update-parameters')
  @ApiOperation({
    summary: '批量更新工作流参数',
    description: '根据搜索条件批量修改工作流中任务的参数值。支持覆盖、默认值、合并等多种模式。',
  })
  @ApiResponse({
    status: 200,
    description: '批量更新成功',
    type: BatchUpdateParametersResultDto,
  })
  async batchUpdateParameters(
    @Body() dto: BatchUpdateParametersDto,
    @Req() request: IRequest,
  ): Promise<BatchUpdateParametersResultDto> {
    return await this.batchEditorService.batchUpdateParameters(request.teamId, request.userId, dto);
  }

  /**
   * AI 辅助批量编辑（推荐使用）
   */
  @Post('ai-assisted-edit')
  @ApiOperation({
    summary: 'AI 辅助批量编辑（推荐）',
    description: '使用自然语言描述批量编辑需求，AI 自动解析并执行。这是最简单易用的批量编辑方式。',
  })
  @ApiResponse({
    status: 200,
    description: 'AI 辅助编辑成功',
    type: AiAssistedBatchEditResultDto,
  })
  async aiAssistedBatchEdit(
    @Body() dto: AiAssistedBatchEditDto,
    @Req() request: IRequest,
  ): Promise<AiAssistedBatchEditResultDto> {
    return await this.batchEditorService.aiAssistedBatchEdit(request.teamId, request.userId, dto);
  }
}
