import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AddEvaluatorToModuleDto } from './dto/add-evaluator-to-module.dto';
import { CreateEvaluationModuleDto } from './dto/create-evaluation-module.dto';
import { CreateEvaluatorDto } from './dto/create-evaluator.dto';
import { AddParticipantsDto } from './dto/req/add-participants.dto';
import { CreateBattleGroupDto } from './dto/req/create-battle-group.dto';
import { CreateBattleDto } from './dto/req/create-battle.dto';
import { GetEloLeaderboardDto } from './dto/req/get-elo-leaderboard.dto';
import { GetLeaderboardScoresDto } from './dto/req/get-leaderboard-scores.dto';
import { SubmitBattleResultDto } from './dto/req/submit-battle-result.dto';
import { EvaluationService } from './evaluation.service';
import { TaskProcessorService } from './services/task-processor.service';
import { TaskProgressService } from './services/task-progress.service';
import { TaskQueueService } from './services/task-queue.service';

@Controller('evaluation')
@ApiTags('Evaluation')
@UseGuards(CompatibleAuthGuard)
export class EvaluationController {
  constructor(
    private readonly evaluationService: EvaluationService,
    private readonly taskQueueService: TaskQueueService,
    private readonly taskProgressService: TaskProgressService,
    private readonly taskProcessorService: TaskProcessorService,
  ) {}

  // ============ 评测模块管理 (新架构) ============

  @Post('/modules')
  @ApiOperation({
    summary: '创建评测模块',
    description: '创建一个新的评测模块及其对应的排行榜',
  })
  public async createEvaluationModule(@Req() req: IRequest, @Body() createDto: CreateEvaluationModuleDto) {
    const { teamId, userId } = req;
    const module = await this.evaluationService.createEvaluationModule(teamId, userId, createDto);
    return new SuccessResponse({ data: module });
  }

  @Get('/modules')
  @ApiOperation({
    summary: '获取评测模块列表',
    description: '获取当前团队的评测模块列表，支持分页和搜索',
  })
  public async listEvaluationModules(@Req() req: IRequest, @Query() query: ListDto) {
    const { teamId } = req;
    const { page, limit, search } = query;

    const { list, totalCount } = await this.evaluationService.listEvaluationModules(teamId, +page, +limit, search);

    return new SuccessListResponse({
      data: list,
      total: totalCount,
      page: +page,
      limit: +limit,
    });
  }

  @Get('/modules/:moduleId')
  @ApiOperation({
    summary: '获取评测模块详情',
    description: '获取指定评测模块的详细信息',
  })
  public async getEvaluationModule(@Req() _req: IRequest, @Param('moduleId') moduleId: string) {
    const module = await this.evaluationService.getEvaluationModule(moduleId);

    if (!module) {
      throw new Error('Evaluation module not found');
    }

    return new SuccessResponse({ data: module });
  }

  @Delete('/modules/:moduleId')
  @ApiOperation({
    summary: '删除评测模块',
    description: '删除指定的评测模块及其相关数据',
  })
  public async deleteEvaluationModule(@Req() _req: IRequest, @Param('moduleId') moduleId: string) {
    await this.evaluationService.deleteEvaluationModule(moduleId);
    return new SuccessResponse({ data: { success: true } });
  }

  @Post('/modules/:moduleId/participants')
  @ApiOperation({
    summary: '添加参与者到评测模块',
    description: '向评测模块添加参与评测的资产',
  })
  public async addParticipantsToModule(@Req() _req: IRequest, @Param('moduleId') moduleId: string, @Body() addParticipantsDto: AddParticipantsDto) {
    await this.evaluationService.addParticipants(moduleId, addParticipantsDto.assetIds);
    return new SuccessResponse({ data: { success: true } });
  }

  // ============ 评测员管理 (新架构) ============

  @Post('/evaluators')
  @ApiOperation({
    summary: '创建评测员',
    description: '创建一个新的评测员（LLM或人工）',
  })
  public async createEvaluator(@Req() _req: IRequest, @Body() createDto: CreateEvaluatorDto) {
    const evaluator = await this.evaluationService.createEvaluator(createDto);
    return new SuccessResponse({ data: evaluator });
  }

  @Get('/evaluators')
  @ApiOperation({
    summary: '获取评测员列表（管理员用）',
    description: '获取所有评测员的列表，主要用于管理员查看和复用已有评测员配置',
  })
  public async listEvaluators(@Req() _req: IRequest, @Query() query: ListDto) {
    const { page, limit, search } = query;

    const { list, totalCount } = await this.evaluationService.listEvaluators(+page, +limit, search);

    return new SuccessListResponse({
      data: list,
      total: totalCount,
      page: +page,
      limit: +limit,
    });
  }

  @Get('/evaluators/:evaluatorId')
  @ApiOperation({
    summary: '获取评测员详情',
    description: '获取指定评测员的详细信息',
  })
  public async getEvaluator(@Req() _req: IRequest, @Param('evaluatorId') evaluatorId: string) {
    const evaluator = await this.evaluationService.getEvaluator(evaluatorId);

    if (!evaluator) {
      throw new Error('Evaluator not found');
    }

    return new SuccessResponse({ data: evaluator });
  }

  @Get('/modules/:moduleId/evaluators')
  @ApiOperation({
    summary: '获取模块的评测员列表',
    description: '获取指定评测模块关联的所有评测员',
  })
  public async getModuleEvaluators(@Req() _req: IRequest, @Param('moduleId') moduleId: string, @Query() query: ListDto) {
    const { page, limit } = query;

    const { list, totalCount } = await this.evaluationService.getEvaluatorsByModule(moduleId, +page, +limit);

    return new SuccessListResponse({
      data: list,
      total: totalCount,
      page: +page,
      limit: +limit,
    });
  }

  @Post('/modules/:moduleId/evaluators')
  @ApiOperation({
    summary: '添加评测员到模块',
    description: '将评测员添加到指定的评测模块',
  })
  public async addEvaluatorToModule(@Req() _req: IRequest, @Param('moduleId') moduleId: string, @Body() addEvaluatorDto: AddEvaluatorToModuleDto) {
    const moduleEvaluator = await this.evaluationService.addEvaluatorToModule(moduleId, addEvaluatorDto.evaluatorId, addEvaluatorDto.weight);
    return new SuccessResponse({ data: moduleEvaluator });
  }

  // ============ 对战管理 (新架构) ============

  @Post('/modules/:moduleId/battles')
  @ApiOperation({
    summary: '创建对战',
    description: '在指定评测模块中创建一场新的对战',
  })
  public async createBattleInModule(@Req() _req: IRequest, @Param('moduleId') moduleId: string, @Body() createBattleDto: CreateBattleDto) {
    const battle = await this.evaluationService.createBattle(moduleId, createBattleDto.assetAId, createBattleDto.assetBId);
    return new SuccessResponse({ data: battle });
  }

  @Get('/modules/:moduleId/battles')
  @ApiOperation({
    summary: '获取评测模块对战记录',
    description: '获取指定评测模块的对战历史记录',
  })
  public async getEvaluationModuleBattles(@Req() _req: IRequest, @Param('moduleId') moduleId: string, @Query() query: ListDto) {
    const { page, limit } = query;

    const { list, totalCount } = await this.evaluationService.getEvaluationModuleBattles(moduleId, +page, +limit);

    return new SuccessListResponse({
      data: list,
      total: totalCount,
      page: +page,
      limit: +limit,
    });
  }

  @Post('/modules/:moduleId/battle-groups')
  @ApiOperation({
    summary: '创建批量对战组',
    description: '在指定评测模块中根据选择的资产和策略创建批量对战',
  })
  public async createBattleGroupInModule(@Req() _req: IRequest, @Param('moduleId') moduleId: string, @Body() createBattleGroupDto: CreateBattleGroupDto) {
    const battleGroup = await this.evaluationService.createBattleGroup(
      moduleId,
      createBattleGroupDto.assetIds,
      createBattleGroupDto.strategy,
      createBattleGroupDto.battleCount,
      createBattleGroupDto.description,
    );

    return new SuccessResponse({ data: battleGroup });
  }

  @Get('/modules/:moduleId/battle-groups')
  @ApiOperation({
    summary: '获取评测模块的批量对战组列表',
    description: '获取指定评测模块的所有批量对战组',
  })
  public async getEvaluationModuleBattleGroups(@Req() _req: IRequest, @Param('moduleId') moduleId: string, @Query() query: ListDto) {
    const { page, limit } = query;

    const { list, totalCount } = await this.evaluationService.getBattleGroupsByEvaluationModule(moduleId, +page, +limit);

    return new SuccessListResponse({
      data: list,
      total: totalCount,
      page: +page,
      limit: +limit,
    });
  }

  @Get('/modules/:moduleId/scores')
  @ApiOperation({
    summary: '获取评测模块评分',
    description: '获取评测模块当前的评分排名',
  })
  public async getEvaluationModuleScores(@Req() _req: IRequest, @Param('moduleId') moduleId: string, @Query() query: GetLeaderboardScoresDto) {
    const { page, limit, evaluatorId } = query;

    const { list, totalCount } = await this.evaluationService.getLeaderboardScores(moduleId, evaluatorId, +page, +limit);

    return new SuccessListResponse({
      data: list,
      total: totalCount,
      page: +page,
      limit: +limit,
    });
  }

  // ============ 通用对战管理 ============

  @Get('/battles/:battleId')
  @ApiOperation({
    summary: '获取对战详情',
    description: '获取指定对战的详细信息',
  })
  public async getBattle(@Req() _req: IRequest, @Param('battleId') battleId: string) {
    const battle = await this.evaluationService.getBattle(battleId);

    if (!battle) {
      throw new Error('Battle not found');
    }

    return new SuccessResponse({ data: battle });
  }

  @Put('/battles/:battleId/result')
  @ApiOperation({
    summary: '提交对战结果',
    description: '提交对战结果并更新相关评分',
  })
  public async submitBattleResult(@Req() _req: IRequest, @Param('battleId') battleId: string, @Body() submitResultDto: SubmitBattleResultDto) {
    const { result, evaluatorId, reason } = submitResultDto;
    await this.evaluationService.submitBattleResult(battleId, result, evaluatorId, reason);

    return new SuccessResponse({ data: { success: true } });
  }

  @Post('/battles/:battleId/auto-evaluate')
  @ApiOperation({
    summary: 'LLM自动评测',
    description: '使用配置的LLM评测员自动评测对战结果',
  })
  public async autoEvaluateBattle(@Req() _req: IRequest, @Param('battleId') battleId: string) {
    const result = await this.evaluationService.autoEvaluateBattle(battleId);
    return new SuccessResponse({ data: result });
  }

  // ============ 批量对战组管理 ============

  @Get('/battle-groups/:battleGroupId')
  @ApiOperation({
    summary: '获取批量对战组详情',
    description: '获取批量对战组的详细信息和进度',
  })
  public async getBattleGroup(@Req() _req: IRequest, @Param('battleGroupId') battleGroupId: string) {
    const battleGroup = await this.evaluationService.getBattleGroup(battleGroupId);

    if (!battleGroup) {
      throw new Error('Battle group not found');
    }

    return new SuccessResponse({ data: battleGroup });
  }

  @Post('/battle-groups/:battleGroupId/auto-evaluate')
  @ApiOperation({
    summary: '批量自动评测（异步）',
    description: '创建异步评测任务，对批量对战组的所有对战进行LLM自动评测',
  })
  public async autoEvaluateBattleGroup(@Req() req: IRequest, @Param('battleGroupId') battleGroupId: string) {
    const { teamId, userId } = req;

    const battleGroup = await this.evaluationService.getBattleGroup(battleGroupId);
    if (!battleGroup) {
      throw new Error('Battle group not found');
    }

    const pendingBattles = await this.evaluationService.getBattlesByGroup(battleGroupId, 'PENDING');

    if (pendingBattles.length === 0) {
      return new SuccessResponse({
        data: {
          message: 'No pending battles to evaluate',
          task: null,
        },
      });
    }

    const task = await this.taskQueueService.createTask(battleGroupId, battleGroup.evaluationModuleId, teamId, userId, pendingBattles.length);

    return new SuccessResponse({
      data: {
        task,
        message: `Evaluation task created with ${pendingBattles.length} battles to process`,
      },
    });
  }

  // ============ 异步任务管理 ============

  @Get('/tasks')
  @ApiOperation({
    summary: '获取用户的评测任务列表',
    description: '获取当前用户的所有评测任务及其状态',
  })
  public async getUserTasks(@Req() req: IRequest) {
    const { teamId, userId } = req;
    const tasks = await this.taskQueueService.getTasksByUser(teamId, userId);
    return new SuccessResponse({ data: tasks });
  }

  @Get('/tasks/:taskId')
  @ApiOperation({
    summary: '获取任务详情',
    description: '获取指定评测任务的详细信息和进度',
  })
  public async getTask(@Req() _req: IRequest, @Param('taskId') taskId: string) {
    const task = await this.taskQueueService.getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const progress = await this.taskProgressService.getProgress(taskId);

    return new SuccessResponse({
      data: {
        ...task,
        progress: progress || task.progress,
      },
    });
  }

  @Get('/tasks/:taskId/progress')
  @ApiOperation({
    summary: '获取任务进度',
    description: '实时获取评测任务的执行进度',
  })
  public async getTaskProgress(@Req() _req: IRequest, @Param('taskId') taskId: string) {
    const progress = await this.taskProgressService.getProgress(taskId);
    if (!progress) {
      throw new Error('Task progress not found');
    }

    return new SuccessResponse({ data: progress });
  }

  @Post('/tasks/:taskId/cancel')
  @ApiOperation({
    summary: '取消评测任务',
    description: '取消指定的评测任务（仅支持未开始的任务）',
  })
  public async cancelTask(@Req() _req: IRequest, @Param('taskId') taskId: string) {
    const success = await this.taskQueueService.cancelTask(taskId);

    return new SuccessResponse({
      data: {
        success,
        message: success ? 'Task cancelled successfully' : 'Cannot cancel task - it may be already processing',
      },
    });
  }

  @Post('/tasks/:taskId/retry')
  @ApiOperation({
    summary: '重试失败的评测任务',
    description: '重新执行失败的评测任务',
  })
  public async retryTask(@Req() _req: IRequest, @Param('taskId') taskId: string) {
    const success = await this.taskProcessorService.retryFailedTask(taskId);

    return new SuccessResponse({
      data: {
        success,
        message: success ? 'Task queued for retry' : 'Cannot retry task - it may not be in failed status',
      },
    });
  }

  @Get('/queue/status')
  @ApiOperation({
    summary: '获取任务队列状态',
    description: '获取当前任务队列的状态信息',
  })
  public async getQueueStatus() {
    const status = await this.taskProcessorService.getProcessorStatus();
    return new SuccessResponse({ data: status });
  }

  // ============ ELO排行榜 ============

  @Get('/modules/:moduleId/elo-leaderboard')
  @ApiOperation({
    summary: '获取ELO排行榜',
    description: '获取指定评测模块的ELO评分排行榜，支持多种排序和筛选选项',
  })
  public async getEloLeaderboard(@Req() _req: IRequest, @Param('moduleId') moduleId: string, @Query() query: GetEloLeaderboardDto) {
    const leaderboard = await this.evaluationService.getEloLeaderboard(moduleId, query);
    return new SuccessResponse({ data: leaderboard });
  }

  @Get('/modules/:moduleId/elo-stats')
  @ApiOperation({
    summary: '获取ELO统计信息',
    description: '获取评测模块的ELO评分统计信息和图表数据',
  })
  public async getEloStats(@Req() _req: IRequest, @Param('moduleId') moduleId: string) {
    const leaderboard = await this.evaluationService.getEloLeaderboard(moduleId, { limit: 1000 });

    const ratingDistribution = this.calculateRatingDistribution(leaderboard.items);
    const topPerformers = leaderboard.items.slice(0, 10);
    const recentChanges = await this.getRecentRatingChanges(moduleId);

    return new SuccessResponse({
      data: {
        overview: leaderboard.stats,
        ratingDistribution,
        topPerformers,
        recentChanges,
        totalParticipants: leaderboard.total,
      },
    });
  }

  private calculateRatingDistribution(items: any[]) {
    const ranges = [
      { min: 0, max: 1200, label: '新手 (0-1200)' },
      { min: 1200, max: 1400, label: '初级 (1200-1400)' },
      { min: 1400, max: 1600, label: '中级 (1400-1600)' },
      { min: 1600, max: 1800, label: '高级 (1600-1800)' },
      { min: 1800, max: 2000, label: '专家 (1800-2000)' },
      { min: 2000, max: Infinity, label: '大师 (2000+)' },
    ];

    return ranges.map((range) => ({
      ...range,
      count: items.filter((item) => item.rating >= range.min && item.rating < range.max).length,
    }));
  }

  private async getRecentRatingChanges(moduleId: string) {
    // 获取最近30天的评分变化
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentBattles = await this.evaluationService.getRecentBattlesWithRatingChanges(
      moduleId,
      thirtyDaysAgo,
      20, // 最多返回20条记录
    );

    return recentBattles.map((battle) => ({
      battleId: battle.id,
      date: battle.completedAt || new Date(battle.createdTimestamp),
      assetA: {
        id: battle.assetAId,
        name: `Asset ${battle.assetAId}`,
        oldRating: Math.round(battle.assetARatingBefore || 0),
        newRating: Math.round(battle.assetARatingAfter || 0),
        change: Math.round((battle.assetARatingAfter || 0) - (battle.assetARatingBefore || 0)),
      },
      assetB: {
        id: battle.assetBId,
        name: `Asset ${battle.assetBId}`,
        oldRating: Math.round(battle.assetBRatingBefore || 0),
        newRating: Math.round(battle.assetBRatingAfter || 0),
        change: Math.round((battle.assetBRatingAfter || 0) - (battle.assetBRatingBefore || 0)),
      },
      result: battle.result,
      winner: battle.result === 'A_WIN' ? battle.assetAId : battle.result === 'B_WIN' ? battle.assetBId : null,
      evaluator: battle.evaluator?.name || 'Unknown',
    }));
  }

  @Get('/assets/:assetId/rating-history')
  @ApiOperation({
    summary: '获取资产评分历史',
    description: '获取指定资产在指定评测模块中的评分变化历史',
  })
  public async getAssetRatingHistory(
    @Req() _req: IRequest,
    @Param('assetId') assetId: string,
    @Query('moduleId') moduleId: string,
    @Query('evaluatorId') evaluatorId?: string,
    @Query('limit') limit?: number,
  ) {
    const history = await this.evaluationService.getAssetRatingHistory(assetId, moduleId, evaluatorId, limit ? parseInt(limit.toString()) : 50);

    return new SuccessResponse({ data: history });
  }

  @Get('/modules/:moduleId/rating-trends')
  @ApiOperation({
    summary: '获取评分趋势数据',
    description: '获取评测模块中所有资产的评分趋势，用于绘制图表',
  })
  public async getRatingTrends(
    @Req() _req: IRequest,
    @Param('moduleId') moduleId: string,
    @Query('days') days?: number,
    @Query('evaluatorId') evaluatorId?: string,
    @Query('limit') limit?: number,
    @Query('minBattles') minBattles?: number,
  ) {
    const trends = await this.evaluationService.getRatingTrends(
      moduleId,
      days ? parseInt(days.toString()) : 30,
      evaluatorId,
      limit ? parseInt(limit.toString()) : 20,
      minBattles ? parseInt(minBattles.toString()) : 5,
    );

    return new SuccessResponse({ data: trends });
  }

  @Get('/modules/:moduleId/chart-data')
  @ApiOperation({
    summary: '获取完整图表数据',
    description: '获取用于ELO图表展示的完整数据，包括评分分布、时间序列、对战矩阵等',
  })
  public async getChartData(
    @Req() _req: IRequest,
    @Param('moduleId') moduleId: string,
    @Query('evaluatorId') evaluatorId?: string,
    @Query('days') days?: number,
    @Query('dataType') dataType?: string,
  ) {
    const chartData = await this.evaluationService.getChartData(moduleId, evaluatorId, days ? parseInt(days.toString()) : 30, dataType);

    return new SuccessResponse({ data: chartData });
  }
}
