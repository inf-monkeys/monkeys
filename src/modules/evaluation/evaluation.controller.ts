import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { MediaFileService } from '@/modules/assets/media/media.service';
import { Body, Controller, Delete, ForbiddenException, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateEvaluationModuleDto } from './dto/create-evaluation-module.dto';
import { GetLeaderboardDto } from './dto/req/get-leaderboard.dto';
import { JoinEvaluationDto } from './dto/req/join-evaluation.dto';
import { EvaluationService } from './evaluation.service';
import { AutoEvaluationService } from './services/auto-evaluation.service';
import { OpenSkillService } from './services/openskill.service';
import { PgTaskQueueService } from './services/pg-task-queue.service';
import { TaskType } from './types/task.types';

@Controller('evaluation')
@ApiTags('Evaluation')
@UseGuards(CompatibleAuthGuard)
export class EvaluationController {
  constructor(
    private readonly evaluationService: EvaluationService,
    private readonly openskillService: OpenSkillService,
    private readonly pgTaskQueueService: PgTaskQueueService,
    private readonly autoEvaluationService: AutoEvaluationService,
    private readonly mediaFileService: MediaFileService,
  ) {}

  // ============ 评测模块管理 ============

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
  public async getEvaluationModule(@Req() req: IRequest, @Param('moduleId') moduleId: string) {
    const { teamId } = req;
    const module = await this.evaluationService.getEvaluationModule(moduleId);

    if (!module || module.teamId !== teamId) {
      throw new ForbiddenException('Evaluation module not found or access denied');
    }

    return new SuccessResponse({ data: module });
  }

  @Delete('/modules/:moduleId')
  @ApiOperation({
    summary: '删除评测模块',
    description: '删除指定的评测模块及其相关数据',
  })
  public async deleteEvaluationModule(@Req() req: IRequest, @Param('moduleId') moduleId: string) {
    const { teamId } = req;

    // 验证模块权限
    const module = await this.evaluationService.getEvaluationModule(moduleId);
    if (!module || module.teamId !== teamId) {
      throw new ForbiddenException('Access denied');
    }

    await this.evaluationService.deleteEvaluationModule(moduleId);
    // 清理Redis数据
    // 清理OpenSkill数据
    await this.openskillService.cleanupModule(teamId, moduleId);

    return new SuccessResponse({ data: { success: true } });
  }

  // ============ OpenSkill评测系统 ============

  @Post('/modules/:moduleId/join')
  @ApiOperation({
    summary: '加入评测排行榜',
    description: '将图片资产加入评测模块的排行榜中，开始参与智能匹配',
  })
  public async joinEvaluation(@Req() req: IRequest, @Param('moduleId') moduleId: string, @Body() joinDto: JoinEvaluationDto) {
    const { teamId } = req;

    // 验证模块权限
    const module = await this.evaluationService.getEvaluationModule(moduleId);
    if (!module || module.teamId !== teamId) {
      throw new ForbiddenException('Access denied');
    }

    // 并行验证所有资产权限
    const assetValidations = await Promise.all(joinDto.assetIds.map((assetId) => this.mediaFileService.getMediaByIdAndTeamId(assetId, teamId)));

    // 检查是否有无效资产
    const invalidAssets = assetValidations
      .map((asset, index) => ({ asset, assetId: joinDto.assetIds[index] }))
      .filter(({ asset }) => !asset)
      .map(({ assetId }) => assetId);

    if (invalidAssets.length > 0) {
      throw new ForbiddenException(`Assets not accessible: ${invalidAssets.join(', ')}`);
    }

    // 将任务添加到后台队列
    await this.pgTaskQueueService.createTask({
      type: TaskType.ADD_ASSETS_TO_MODULE,
      moduleId,
      teamId,
      userId: req.userId,
      total: joinDto.assetIds.length,
      payload: {
        assetIds: joinDto.assetIds,
      },
    });

    return new SuccessResponse({
      data: {
        success: true,
        message: `Accepted ${joinDto.assetIds.length} assets for evaluation. Processing in background.`,
      },
    });
  }

  @Get('/modules/:moduleId/assets')
  @ApiOperation({
    summary: '获取排行榜中的资产列表',
    description: '获取当前评测模块排行榜中已有的所有资产ID',
  })
  public async getAssetsInModule(@Req() req: IRequest, @Param('moduleId') moduleId: string) {
    const { teamId } = req;

    // 验证模块权限
    const module = await this.evaluationService.getEvaluationModule(moduleId);
    if (!module || module.teamId !== teamId) {
      throw new ForbiddenException('Access denied');
    }

    const assetIds = await this.openskillService.getAssetsInModule(teamId, moduleId);

    return new SuccessResponse({
      data: {
        assetIds,
        total: assetIds.length,
      },
    });
  }

  @Get('/modules/:moduleId/available-assets')
  @ApiOperation({
    summary: '获取可加入排行榜的图片',
    description: '获取用户media中未加入当前排行榜的图片列表',
  })
  public async getAvailableAssets(@Req() req: IRequest, @Param('moduleId') moduleId: string, @Query() query: ListDto) {
    const { teamId } = req;
    const { page = 1, limit = 100 } = query;

    // 验证模块权限
    const module = await this.evaluationService.getEvaluationModule(moduleId);
    if (!module || module.teamId !== teamId) {
      throw new ForbiddenException('Access denied');
    }

    // 并行执行获取已在排行榜中的资产和媒体文件列表
    const [assetsInModule, mediaResult] = await Promise.all([this.openskillService.getAssetsInModule(teamId, moduleId), this.mediaFileService.listRichMedias(teamId, { page: +page, limit: +limit })]);

    // 在内存中过滤，避免数据库二次查询
    const excludeSet = new Set(assetsInModule);
    const filteredList = mediaResult.list.filter((media) => !excludeSet.has(media.id));
    const filteredTotal = Math.max(0, mediaResult.totalCount - assetsInModule.length); // 粗略估计

    return new SuccessListResponse({
      data: filteredList,
      total: filteredTotal,
      page: +page,
      limit: +limit,
    });
  }

  @Get('/modules/:moduleId/leaderboard')
  @ApiOperation({
    summary: '获取OpenSkill排行榜',
    description: '获取基于OpenSkill算法的实时排行榜',
  })
  public async getLeaderboard(@Req() req: IRequest, @Param('moduleId') moduleId: string, @Query() query: GetLeaderboardDto) {
    const { teamId } = req;
    const { page = 1, limit = 20 } = query;

    // 验证模块权限
    const module = await this.evaluationService.getEvaluationModule(moduleId);
    if (!module || module.teamId !== teamId) {
      throw new ForbiddenException('Access denied');
    }

    const leaderboard = await this.openskillService.getLeaderboard(teamId, moduleId, +page, +limit);

    return new SuccessListResponse({
      data: leaderboard.items,
      total: leaderboard.total,
      page: leaderboard.page,
      limit: leaderboard.limit,
    });
  }

  @Get('/modules/:moduleId/recent-battles')
  @ApiOperation({
    summary: '获取最近对战记录',
    description: '获取最近完成的对战结果',
  })
  public async getRecentBattles(@Req() req: IRequest, @Param('moduleId') moduleId: string, @Query('limit') limit?: number) {
    const { teamId } = req;

    // 验证模块权限
    const module = await this.evaluationService.getEvaluationModule(moduleId);
    if (!module || module.teamId !== teamId) {
      throw new ForbiddenException('Access denied');
    }

    const battles = await this.openskillService.getRecentBattles(teamId, moduleId, limit ? +limit : 50);

    return new SuccessResponse({ data: battles });
  }

  @Get('/modules/:moduleId/evaluation-status')
  @ApiOperation({
    summary: '获取评测完成状态',
    description: '基于OpenSkill sigma值判断评测是否完成',
  })
  public async getEvaluationStatus(@Req() req: IRequest, @Param('moduleId') moduleId: string) {
    const { teamId } = req;
    // console.log('req全部信息:', req);
    const start = Date.now(); // 记录开始时间

    const module = await this.evaluationService.getEvaluationModule(moduleId);

    // 打印关键调试信息
    // console.log('[DEBUG evaluation-status]', 'req.user.id:', req.user?.id, 'req.teamId:', teamId, 'module.teamId:', module?.teamId, 'moduleId:', moduleId);

    if (!module || module.teamId !== teamId) {
      console.log('[DEBUG evaluation-status] Access denied!');
      throw new ForbiddenException('Access denied');
    }

    // 检查任务是否已被标记为完成
    if (this.autoEvaluationService.isEvaluationComplete(moduleId)) {
      const end = Date.now();
      console.log('[DEBUG evaluation-status] Done (已完成), 耗时', end - start, 'ms');
      return new SuccessResponse({
        data: {
          isComplete: true,
          progress: 100,
        },
      });
    }

    // 如果任务仍在进行中，则获取实时状态
    const status = await this.openskillService.getEvaluationStatus(teamId, moduleId);
    const end = Date.now();
    console.log('[DEBUG evaluation-status] Done (进行中), 耗时', end - start, 'ms');
    return new SuccessResponse({
      data: {
        isComplete: status.isComplete,
        progress: status.progress,
      },
    });
  }

  @Get('/modules/:moduleId/chart-data')
  @ApiOperation({
    summary: '获取图表数据',
    description: '获取ELO评分图表数据，支持多种数据类型',
  })
  public async getChartData(@Req() req: IRequest, @Param('moduleId') moduleId: string, @Query('dataType') dataType?: string, @Query('evaluatorId') evaluatorId?: string, @Query('days') days?: number) {
    const { teamId } = req;

    // 验证模块权限
    const module = await this.evaluationService.getEvaluationModule(moduleId);
    if (!module || module.teamId !== teamId) {
      throw new ForbiddenException('Access denied');
    }

    const chartData = await this.evaluationService.getChartData(moduleId, evaluatorId, days, dataType);

    return new SuccessResponse({ data: chartData });
  }

  @Get('/modules/:moduleId/elo-leaderboard')
  @ApiOperation({
    summary: '获取ELO排行榜',
    description: '获取增强版ELO排行榜，包含完整统计信息',
  })
  public async getEloLeaderboard(@Req() req: IRequest, @Param('moduleId') moduleId: string, @Query() query: GetLeaderboardDto) {
    const { teamId } = req;

    // 验证模块权限
    const module = await this.evaluationService.getEvaluationModule(moduleId);
    if (!module || module.teamId !== teamId) {
      throw new ForbiddenException('Access denied');
    }

    const options = {
      page: query.page,
      limit: query.limit,
    };

    const leaderboard = await this.evaluationService.getEloLeaderboard(moduleId, options);

    return new SuccessResponse({ data: leaderboard });
  }

  @Get('/modules/:moduleId/elo-stats')
  @ApiOperation({
    summary: '获取ELO统计数据',
    description: '获取ELO评分统计信息，包含参与者数量、平均分等',
  })
  public async getEloStats(@Req() req: IRequest, @Param('moduleId') moduleId: string) {
    const { teamId } = req;

    // 验证模块权限
    const module = await this.evaluationService.getEvaluationModule(moduleId);
    if (!module || module.teamId !== teamId) {
      throw new ForbiddenException('Access denied');
    }

    // 获取排行榜数据用于统计
    const leaderboard = await this.evaluationService.getEloLeaderboard(moduleId, { limit: 1000 });
    const recentBattles = await this.openskillService.getRecentBattles(teamId, moduleId, 100);

    const stats = {
      totalParticipants: leaderboard.items?.length || 0,
      totalBattles: leaderboard.module?.totalBattles || 0,
      averageRating: leaderboard.items?.length > 0 ? leaderboard.items.reduce((sum, item) => sum + (item.rating || 1500), 0) / leaderboard.items.length : 1500,
      recentChanges: recentBattles.map((battle) => ({
        battleId: battle.battleId,
        timestamp: battle.timestamp,
        assetA: {
          id: battle.assetAId,
          oldRating: battle.oldRatingA || 1500,
          newRating: battle.newRatingA || 1500,
        },
        assetB: {
          id: battle.assetBId,
          oldRating: battle.oldRatingB || 1500,
          newRating: battle.newRatingB || 1500,
        },
      })),
    };

    return new SuccessResponse({ data: stats });
  }

  @Get('/modules/:moduleId/rating-trends')
  @ApiOperation({
    summary: '获取评分趋势',
    description: '获取资产评分随时间变化的趋势数据',
  })
  public async getRatingTrends(
    @Req() req: IRequest,
    @Param('moduleId') moduleId: string,
    @Query('days') days?: number,
    @Query('evaluatorId') evaluatorId?: string,
    @Query('limit') limit?: number,
    @Query('minBattles') minBattles?: number,
  ) {
    const { teamId } = req;

    // 验证模块权限
    const module = await this.evaluationService.getEvaluationModule(moduleId);
    if (!module || module.teamId !== teamId) {
      throw new ForbiddenException('Access denied');
    }

    const trends = await this.evaluationService.getRatingTrends(moduleId, days || 30, evaluatorId, limit, minBattles);

    return new SuccessResponse({ data: trends });
  }

  @Get('/modules/:moduleId/assets/:assetId/rating-history')
  @ApiOperation({
    summary: '获取资产评分历史',
    description: '获取单个资产的评分变化历史',
  })
  public async getAssetRatingHistory(
    @Req() req: IRequest,
    @Param('moduleId') moduleId: string,
    @Param('assetId') assetId: string,
    @Query('evaluatorId') evaluatorId?: string,
    @Query('limit') limit?: number,
  ) {
    const { teamId } = req;

    // 验证模块权限
    const module = await this.evaluationService.getEvaluationModule(moduleId);
    if (!module || module.teamId !== teamId) {
      throw new ForbiddenException('Access denied');
    }

    // 验证资产权限
    const asset = await this.mediaFileService.getMediaByIdAndTeamId(assetId, teamId);
    if (!asset) {
      throw new ForbiddenException(`Asset ${assetId} not accessible`);
    }

    const history = await this.evaluationService.getAssetRatingHistory(assetId, moduleId, evaluatorId, limit);

    return new SuccessResponse({ data: history });
  }

  @Get('/modules/:moduleId/export/html')
  @ApiOperation({
    summary: '导出排行榜HTML',
    description: '导出指定评分区间的排行榜HTML文件，仅在评测稳定后可用',
  })
  public async exportLeaderboardHtml(
    @Req() req: IRequest,
    @Param('moduleId') moduleId: string,
    @Query('minRating') minRating?: string,
    @Query('maxRating') maxRating?: string,
    @Query('limit') limit?: string,
    @Query('minBattles') minBattles?: string,
  ) {
    const { teamId } = req;

    // 验证模块权限
    const module = await this.evaluationService.getEvaluationModule(moduleId);
    if (!module || module.teamId !== teamId) {
      throw new ForbiddenException('Access denied');
    }

    // 检查评测是否已稳定（双重检查确保稳定性）
    const isTaskComplete = this.autoEvaluationService.isEvaluationComplete(moduleId);
    const status = await this.openskillService.getEvaluationStatus(teamId, moduleId);

    if (!isTaskComplete || !status.isComplete) {
      throw new ForbiddenException('Export is only available after evaluation is complete and stable');
    }

    // 解析参数
    const exportOptions = {
      minRating: minRating ? parseFloat(minRating) : undefined,
      maxRating: maxRating ? parseFloat(maxRating) : undefined,
      limit: limit ? Math.min(parseInt(limit), 5000) : 1000, // 最大5000条保护性能
      minBattles: minBattles ? parseInt(minBattles) : 0,
    };

    // 生成HTML
    const html = await this.evaluationService.generateLeaderboardHtml(teamId, moduleId, module, exportOptions);

    // 设置下载响应头
    const timestamp = new Date().toISOString().split('T')[0];
    const ratingRange = exportOptions.minRating || exportOptions.maxRating ? `_${exportOptions.minRating || 'min'}-${exportOptions.maxRating || 'max'}` : '';
    const filename = `leaderboard-${moduleId}${ratingRange}_${timestamp}.html`;

    req.res.setHeader('Content-Type', 'text/html; charset=utf-8');
    req.res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    req.res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // 不缓存，确保数据实时性

    return html;
  }

  @Get('/modules/:moduleId/export/csv')
  @ApiOperation({
    summary: '导出完整排行榜CSV',
    description: '导出包含所有参与资产的完整排行榜数据（CSV格式），仅在评测稳定后可用',
  })
  public async exportLeaderboardCsv(@Req() req: IRequest, @Param('moduleId') moduleId: string, @Query('includeImageUrls') includeImageUrls?: string) {
    const { teamId } = req;

    // 验证模块权限
    const module = await this.evaluationService.getEvaluationModule(moduleId);
    if (!module || module.teamId !== teamId) {
      throw new ForbiddenException('Access denied');
    }

    // 检查评测是否已稳定（双重检查确保稳定性）
    const isTaskComplete = this.autoEvaluationService.isEvaluationComplete(moduleId);
    const status = await this.openskillService.getEvaluationStatus(teamId, moduleId);

    if (!isTaskComplete || !status.isComplete) {
      throw new ForbiddenException('Export is only available after evaluation is complete and stable');
    }

    const includeImages = includeImageUrls === 'true';

    // 生成CSV
    const csv = await this.evaluationService.generateLeaderboardCsv(teamId, moduleId, module, { includeImageUrls: includeImages });

    // 设置下载响应头
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `leaderboard-complete-${moduleId}_${timestamp}.csv`;

    req.res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    req.res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    req.res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // 不缓存，确保数据实时性

    return csv;
  }

  // ============ 系统管理 ============

  @Get('/queue/status')
  @ApiOperation({
    summary: '获取任务队列状态',
    description: '获取当前任务队列的状态信息',
  })
  public async getQueueStatus(@Req() req: IRequest) {
    const { teamId } = req;
    const status = await this.pgTaskQueueService.getTeamQueueStats(teamId);
    return new SuccessResponse({ data: status });
  }
}
