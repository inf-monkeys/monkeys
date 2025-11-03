import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateEvaluationDataRequestDto } from './dto/vr-evaluation.dto';
import { CreateVRTaskDto, UpdateEvaluationDataDto, VREvaluationService } from './vr-evaluation.service';

@Controller('vr-evaluation')
@ApiTags('VR Evaluation')
export class VREvaluationController {
  constructor(private readonly vrEvaluationService: VREvaluationService) {}

  // ============ Vision Pro 端接口 ============

  @Get('/getTaskList')
  @ApiOperation({
    summary: '获取所有评测任务列表',
    description: 'Vision Pro 端拉取所有评测任务的列表',
  })
  @UseGuards(CompatibleAuthGuard)
  async getTaskList(@Req() req: IRequest) {
    const { teamId } = req;
    const result = await this.vrEvaluationService.getTaskList(teamId);
    return result;
  }

  @Post('/updateEvaluateData')
  @ApiOperation({
    summary: '上传评测数据',
    description: 'Vision Pro 端上传评测数据',
  })
  @UseGuards(CompatibleAuthGuard)
  async updateEvaluateData(@Body() dto: UpdateEvaluationDataRequestDto) {
    const payload: UpdateEvaluationDataDto = {
      taskId: dto.task_id,
      evaluationResult: {
        score_1: dto.evaluation_result.score_1,
        score_2: dto.evaluation_result.score_2,
        score_3: dto.evaluation_result.score_3,
        score_4: dto.evaluation_result.score_4,
        score_5: dto.evaluation_result.score_5,
        score_6: dto.evaluation_result.score_6,
        score_7: dto.evaluation_result.score_7,
        score_8: dto.evaluation_result.score_8,
        score_9: dto.evaluation_result.score_9,
        score_10: dto.evaluation_result.score_10,
      },
    };

    const result = await this.vrEvaluationService.updateEvaluationData(payload);
    return result;
  }

  // ============ Web 端管理接口 ============

  @Post('/tasks')
  @ApiOperation({
    summary: '创建 VR 评测任务',
    description: 'Web 端创建新的 VR 评测任务',
  })
  @UseGuards(CompatibleAuthGuard)
  async createTask(@Req() req: IRequest, @Body() dto: CreateVRTaskDto) {
    const { teamId, userId } = req;
    const task = await this.vrEvaluationService.createTask(teamId, userId, dto);
    return new SuccessResponse({ data: task });
  }

  @Get('/tasks')
  @ApiOperation({
    summary: '获取 VR 评测任务列表',
    description: 'Web 端获取 VR 评测任务列表，支持分页',
  })
  @UseGuards(CompatibleAuthGuard)
  async listTasks(@Req() req: IRequest, @Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    const { teamId } = req;
    const result = await this.vrEvaluationService.listTasks(teamId, page, limit);
    return new SuccessResponse(result);
  }

  @Get('/tasks/:id')
  @ApiOperation({
    summary: '获取任务详情',
    description: '获取指定 VR 评测任务的详情',
  })
  @UseGuards(CompatibleAuthGuard)
  async getTaskDetail(@Req() req: IRequest, @Param('id') taskId: string) {
    const { teamId } = req;
    const task = await this.vrEvaluationService.getTaskDetail(taskId, teamId);
    return new SuccessResponse({ data: task });
  }

  @Delete('/tasks/:id')
  @ApiOperation({
    summary: '删除任务',
    description: '删除指定的 VR 评测任务',
  })
  @UseGuards(CompatibleAuthGuard)
  async deleteTask(@Req() req: IRequest, @Param('id') taskId: string) {
    const { teamId } = req;
    const result = await this.vrEvaluationService.deleteTask(taskId, teamId);
    return new SuccessResponse({ data: result });
  }

  @Get('/statistics')
  @ApiOperation({
    summary: '获取统计数据',
    description: '获取 VR 评测的统计数据',
  })
  @UseGuards(CompatibleAuthGuard)
  async getStatistics(@Req() req: IRequest) {
    const { teamId } = req;
    const stats = await this.vrEvaluationService.getStatistics(teamId);
    return new SuccessResponse({ data: stats });
  }
}
