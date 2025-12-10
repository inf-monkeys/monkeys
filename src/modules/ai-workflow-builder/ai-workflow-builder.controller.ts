import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiWorkflowBuilderService } from './ai-workflow-builder.service';
import { SmartRouterService } from './smart-router.service';
import { GenerateWorkflowDto, BatchGenerateSameDto, BatchGenerateDifferentDto } from './dto/generate-workflow.dto';
import { WorkflowGenerationResult, BatchGenerationResult } from './dto/workflow-generation-result.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { TeamGuard } from '@/common/guards/team.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentTeam } from '@/common/decorators/current-team';

/**
 * AI 工作流生成器控制器
 * 提供基于自然语言的工作流自动生成 API
 */
@ApiTags('AI Workflow Builder')
@ApiBearerAuth()
@Controller('ai-workflow-builder')
@UseGuards(CompatibleAuthGuard, TeamGuard)
export class AiWorkflowBuilderController {
  constructor(
    private readonly aiWorkflowBuilderService: AiWorkflowBuilderService,
    private readonly smartRouter: SmartRouterService,
  ) {}

  /**
   * 生成单个工作流
   */
  @Post('generate')
  @ApiOperation({
    summary: '生成单个工作流',
    description: '根据自然语言描述自动生成一个工作流',
  })
  @ApiResponse({
    status: 200,
    description: '工作流生成成功',
    type: WorkflowGenerationResult,
  })
  async generateWorkflow(@Body() dto: GenerateWorkflowDto, @CurrentTeam() teamId: string, @CurrentUser('userId') userId: string): Promise<WorkflowGenerationResult> {
    return await this.aiWorkflowBuilderService.generateWorkflow(dto, teamId, userId);
  }

  /**
   * 批量生成相同的工作流
   */
  @Post('batch-generate-same')
  @ApiOperation({
    summary: '批量生成相同工作流',
    description: '根据一个描述批量生成多个相同的工作流（仅名称/ID不同）',
  })
  @ApiResponse({
    status: 200,
    description: '批量生成成功',
    type: BatchGenerationResult,
  })
  async batchGenerateSame(@Body() dto: BatchGenerateSameDto, @CurrentTeam() teamId: string, @CurrentUser('userId') userId: string): Promise<BatchGenerationResult> {
    return await this.aiWorkflowBuilderService.batchGenerateSame(dto, teamId, userId);
  }

  /**
   * 批量生成不同的工作流
   */
  @Post('batch-generate')
  @ApiOperation({
    summary: '批量生成不同工作流',
    description: '根据多个不同的描述批量生成工作流',
  })
  @ApiResponse({
    status: 200,
    description: '批量生成成功',
    type: BatchGenerationResult,
  })
  async batchGenerateDifferent(@Body() dto: BatchGenerateDifferentDto, @CurrentTeam() teamId: string, @CurrentUser('userId') userId: string): Promise<BatchGenerationResult> {
    return await this.aiWorkflowBuilderService.batchGenerateDifferent(dto, teamId, userId);
  }

  /**
   * 智能批量生成工作流（推荐使用）
   * 使用模板优先 + AI兜底的混合策略，大幅降低Token成本和生成时间
   */
  @Post('batch-generate-smart')
  @ApiOperation({
    summary: '智能批量生成工作流（推荐）',
    description: '使用模板优先策略批量生成工作流，自动选择最优生成方式（模板或AI），节省95% Token成本',
  })
  @ApiResponse({
    status: 200,
    description: '批量生成成功',
    type: BatchGenerationResult,
  })
  async batchGenerateSmart(@Body() dto: BatchGenerateDifferentDto, @CurrentTeam() teamId: string, @CurrentUser('userId') userId: string): Promise<BatchGenerationResult> {
    return await this.aiWorkflowBuilderService.batchGenerateSmart(dto, teamId, userId);
  }

  /**
   * 预览模板匹配
   * 用于前端展示：根据描述预览会使用哪个模板或是否降级到AI生成
   */
  @Post('preview-template-match')
  @ApiOperation({
    summary: '预览模板匹配',
    description: '根据用户描述预览会使用哪个模板生成工作流，帮助用户了解生成方式',
  })
  @ApiResponse({
    status: 200,
    description: '预览成功',
  })
  async previewTemplateMatch(@Body() dto: { description: string }) {
    return await this.smartRouter.previewTemplateMatch(dto.description);
  }
}
