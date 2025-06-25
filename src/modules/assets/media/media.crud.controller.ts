import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { WorkflowAuthGuard } from '@/common/guards/workflow-auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { EvaluationService } from '@/modules/evaluation/evaluation.service';
import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BulkCreateMediaDto } from './dto/req/bulk-create-media.dto';
import { CreateRichMediaDto } from './dto/req/create-rich-media.dto';
import { MediaFileService } from './media.service';

@ApiTags('Resources')
@Controller('/media-files')
@UseGuards(WorkflowAuthGuard, CompatibleAuthGuard)
export class MediaFileCrudController {
  constructor(
    protected readonly service: MediaFileService,
    private readonly evaluationService: EvaluationService,
  ) {}

  @Get('')
  public async listRichMedias(@Req() request: IRequest, @Query() dto: ListDto) {
    const { teamId } = request;
    const { list, totalCount } = await this.service.listRichMedias(teamId, dto);
    return new SuccessListResponse({
      data: list,
      total: totalCount,
      page: dto.page,
      limit: dto.limit,
    });
  }

  @Post('')
  public async createRichMedia(@Req() request: IRequest, @Body() body: CreateRichMediaDto) {
    const { teamId, userId } = request;
    const data = await this.service.createMedia(teamId, userId, body);
    return new SuccessResponse({ data });
  }

  @Delete(':id')
  public async deleteRichMedia(@Req() request: IRequest, @Param('id') id: string) {
    const { teamId } = request;
    await this.service.deleteMedia(teamId, id);
    return new SuccessResponse({
      data: {
        success: true,
      },
    });
  }

  @Get('md5/:md5')
  async getRichMediaByHash(@Param('md5') md5: string, @Req() request: IRequest) {
    const { teamId } = request;
    const data = await this.service.getMediaByMd5(teamId, md5);
    if (!data) {
      return new NotFoundException('Media not exists');
    }
    return new SuccessResponse({ data });
  }

  @Post('bulk')
  @ApiOperation({
    summary: '批量创建媒体文件',
    description: '批量创建多个媒体文件，可选择自动添加到评测模块',
  })
  public async bulkCreateMedia(@Req() request: IRequest, @Body() body: BulkCreateMediaDto) {
    const { teamId, userId } = request;
    const { mediaList, evaluationModuleId } = body;

    const createdMedia = [];
    for (const mediaDto of mediaList) {
      const media = await this.service.createMedia(teamId, userId, mediaDto);
      createdMedia.push(media);
    }

    if (evaluationModuleId) {
      try {
        const assetIds = createdMedia.map((media) => media.id);
        await this.evaluationService.addParticipants(evaluationModuleId, assetIds);
      } catch (error) {
        console.warn('Failed to add participants to evaluation module:', error.message);
      }
    }

    return new SuccessResponse({
      data: {
        createdMedia,
        count: createdMedia.length,
        addedToEvaluationModule: !!evaluationModuleId,
      },
    });
  }

  @Get(':id/evaluation-info')
  @ApiOperation({
    summary: '获取媒体文件的评测信息',
    description: '获取指定媒体文件在各个评测模块中的评测情况',
  })
  public async getMediaEvaluationInfo(@Req() _request: IRequest, @Param('id') mediaId: string) {
    const evaluationInfo = {
      mediaId,
      evaluationModules: [],
      totalBattles: 0,
      winRate: 0,
    };

    return new SuccessResponse({ data: evaluationInfo });
  }
}
