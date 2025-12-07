import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { WorkflowAuthGuard } from '@/common/guards/workflow-auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { EvaluationService } from '@/modules/evaluation/evaluation.service';
import { ToolsForwardService } from '@/modules/tools/tools.forward.service';
import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BulkCreateMediaDto } from './dto/req/bulk-create-media.dto';
import { CreateRichMediaDto } from './dto/req/create-rich-media.dto';
import { ImageGenerateJsonDto } from './dto/req/image-generate-json.dto';
import { TextGenerate3DModelDto } from './dto/req/text-generate-3dmodel.dto';
import { TextGenerateImageDto } from './dto/req/text-generate-image.dto';
import { TextGenerateJsonDto } from './dto/req/text-generate-json.dto';
import { TextGenerateMarkdownDto } from './dto/req/text-generate-markdown.dto';
import { TogglePinMediaDto } from './dto/req/toggle-pin-media.dto';
import { UpdateMediaDto } from './dto/req/update-media.dto';
import { MediaFileService } from './media.service';

@ApiTags('Resources')
@Controller('/media-files')
@UseGuards(WorkflowAuthGuard, CompatibleAuthGuard)
export class MediaFileCrudController {
  constructor(
    protected readonly service: MediaFileService,
    private readonly evaluationService: EvaluationService,
    private readonly toolsForwardService: ToolsForwardService,
  ) {}

  @Get('/folder-view')
  @ApiOperation({
    summary: '获取文件夹视图数据',
    description: '返回每个分组的4张预览图，用于文件夹视图展示',
  })
  public async listRichMediasForFolderView(@Req() request: IRequest, @Query('search') search?: string) {
    const { teamId } = request;
    const folders = await this.service.listRichMediasForFolderView(teamId, search);
    return new SuccessResponse({
      data: folders,
    });
  }

  @Get('')
  public async listRichMedias(@Req() request: IRequest, @Query() dto: ListDto, @Query('filterNeuralModel') filterNeuralModel?: 'only' | 'exclude' | 'all') {
    const { teamId } = request;
    const { list, totalCount } = await this.service.listRichMedias(teamId, dto, undefined, filterNeuralModel);
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

  @Get(':id')
  @ApiOperation({
    summary: '根据 Asset ID 获取媒体文件信息 (带权限校验)',
    description: '通过媒体文件的唯一 Asset ID 获取其详细信息，会校验用户所属的 teamId。',
  })
  public async getMediaByIdWithAuth(@Req() request: IRequest, @Param('id') id: string) {
    const { teamId } = request;

    const data = await this.service.getMediaByIdAndTeamId(id, teamId);

    if (!data) {
      throw new NotFoundException('Media file not found or access denied');
    }

    // 为私有存储返回可访问 URL（S3/OSS 或 Azure）
    try {
      const signedUrl = await this.service.getPublicUrl(data);
      return new SuccessResponse({ data: { ...data, url: signedUrl } });
    } catch (error) {
      // 如果签名失败，仍返回原始数据避免前端崩溃
      return new SuccessResponse({ data });
    }
  }

  @Put(':id')
  @ApiOperation({
    summary: '更新设计资产信息',
    description: '更新设计资产（媒体文件）的信息，如缩略图、显示名称、描述等',
  })
  public async updateDesignAsset(@Req() request: IRequest, @Param('id') id: string, @Body() updateDto: UpdateMediaDto) {
    const { teamId } = request;

    // 验证媒体文件是否存在且属于当前团队
    const media = await this.service.getMediaByIdAndTeamId(id, teamId);
    if (!media) {
      throw new NotFoundException('Media file not found or access denied');
    }

    const updatedMedia = await this.service.updateDesignAsset(id, teamId, updateDto);
    return new SuccessResponse({ data: updatedMedia });
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

  @Put(':id/pin')
  @ApiOperation({
    summary: '置顶/取消置顶媒体文件',
    description: '切换媒体文件的置顶状态。置顶时会自动设置 sort 值，取消置顶时会重置 sort 值。',
  })
  public async togglePinMedia(@Req() request: IRequest, @Param('id') id: string, @Body() togglePinDto: TogglePinMediaDto) {
    const { teamId } = request;

    // 验证媒体文件是否存在且属于当前团队
    const media = await this.service.getMediaByIdAndTeamId(id, teamId);
    if (!media) {
      throw new NotFoundException('Media file not found or access denied');
    }

    await this.service.togglePin(id, teamId, togglePinDto.pinned);
    return new SuccessResponse({ data: { success: true } });
  }

  @Post(':id/image-generate-txt')
  @ApiOperation({
    summary: '使用 AI 为图片生成描述',
    description: '调用 monkey-tools-concept-design 的 image_to_function 工具为图片生成描述，并将描述保存到媒体库',
  })
  public async imageGenerateTxt(@Req() request: IRequest, @Param('id') id: string) {
    const { teamId, userId } = request;

    // 验证媒体文件是否存在且属于当前团队
    const media = await this.service.getMediaByIdAndTeamId(id, teamId);
    if (!media) {
      throw new NotFoundException('Media file not found or access denied');
    }
    const createdMedia = await this.service.ImageGenerateTxt(id, teamId, userId, media);
    return new SuccessResponse({ data: createdMedia });
  }

  @Post(':id/image-generate-markdown')
  @ApiOperation({
    summary: '使用 AI 从图片生成 Markdown 描述',
    description: '调用 monkey-tools-concept-design 的 image_to_function 工具从图片生成 Markdown 格式的描述，并将描述保存到媒体库的 params 中',
  })
  public async imageGenerateMarkdown(@Req() request: IRequest, @Param('id') id: string) {
    const { teamId, userId } = request;

    // 验证媒体文件是否存在且属于当前团队
    const media = await this.service.getMediaByIdAndTeamId(id, teamId);
    if (!media) {
      throw new NotFoundException('Media file not found or access denied');
    }

    try {
      const markdown = await this.service.ImageGenerateMarkdown(id, teamId, userId, media);
      return new SuccessResponse({ data: { markdown } });
    } catch (error) {
      throw new BadRequestException(`Failed to generate markdown from image: ${error.message}`);
    }
  }

  @Post(':id/image-generate-3d-model')
  @ApiOperation({
    summary: '使用 AI 从图片生成3D模型',
    description: '调用 monkey-tools-concept-design 的 image_to_function 工具从图片生成3D模型，并将模型保存到媒体库',
  })
  public async imageGenerate3DModel(@Req() request: IRequest, @Param('id') id: string) {
    const { teamId, userId } = request;

    // 验证媒体文件是否存在且属于当前团队
    const media = await this.service.getMediaByIdAndTeamId(id, teamId);
    if (!media) {
      throw new NotFoundException('Media file not found or access denied');
    }

    try {
      const createdMedia = await this.service.ImageGenerate3DModel(id, teamId, userId, media);
      return new SuccessResponse({ data: createdMedia });
    } catch (error) {
      throw new BadRequestException(`Failed to generate 3D model from image: ${error.message}`);
    }
  }

  @Post(':id/image-generate-json')
  @ApiOperation({
    summary: '使用 AI 从图片生成JSON（神经模型）',
    description: '调用 monkey-tools-concept-design 的 image_to_function 工具从图片生成JSON格式的神经模型数据，并将JSON保存到媒体库',
  })
  public async imageGenerateJson(@Req() request: IRequest, @Param('id') id: string, @Body() body: ImageGenerateJsonDto) {
    const { teamId, userId } = request;
    const { jsonFileName } = body;

    // 验证媒体文件是否存在且属于当前团队
    const media = await this.service.getMediaByIdAndTeamId(id, teamId);
    if (!media) {
      throw new NotFoundException('Media file not found or access denied');
    }

    try {
      const createdMedia = await this.service.ImageGenerateJson(id, teamId, userId, media, jsonFileName);
      return new SuccessResponse({ data: createdMedia });
    } catch (error) {
      throw new BadRequestException(`Failed to generate JSON from image: ${error.message}`);
    }
  }

  @Post(':id/txt-generate-image')
  @ApiOperation({
    summary: '使用 AI 根据文本生成图片',
    description: '调用 monkey-tools-concept-design 的 text_to_image 工具根据文本描述自动生成图片，并将图片保存到媒体库',
  })
  public async textGenerateImage(@Req() request: IRequest, @Param('id') id: string, @Body() body: TextGenerateImageDto) {
    const { teamId, userId } = request;
    const { text, jsonFileName } = body;

    // 验证媒体文件是否存在且属于当前团队
    const media = await this.service.getMediaByIdAndTeamId(id, teamId);
    if (!media) {
      throw new NotFoundException('Media file not found or access denied');
    }

    try {
      const createdMedia = await this.service.TextGenerateImage(teamId, userId, text, jsonFileName);

      return new SuccessResponse({
        data: createdMedia,
      });
    } catch (error) {
      throw new BadRequestException(`Failed to generate image: ${error.message}`);
    }
  }

  @Post(':id/txt-generate-markdown')
  @ApiOperation({
    summary: '使用 AI 根据文本生成 Markdown 描述',
    description: '调用 monkey-tools-concept-design 的 text_to_function 工具根据文本生成 Markdown 格式的描述，并将描述保存到媒体库',
  })
  public async textGenerateMarkdown(@Req() request: IRequest, @Param('id') id: string, @Body() body: TextGenerateMarkdownDto) {
    const { teamId, userId } = request;
    const { text } = body;

    // 验证媒体文件是否存在且属于当前团队
    const media = await this.service.getMediaByIdAndTeamId(id, teamId);
    if (!media) {
      throw new NotFoundException('Media file not found or access denied');
    }

    try {
      const markdown = await this.service.TextGenerateMarkdown(id, teamId, userId, text);

      return new SuccessResponse({
        data: { markdown },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to generate markdown: ${error.message}`);
    }
  }

  @Post(':id/txt-generate-3d-model')
  @ApiOperation({
    summary: '使用 AI 根据文本生成3D模型',
    description: '调用 monkey-tools-concept-design 的 text_to_3d_model 工具根据文本描述自动生成3D模型，并将模型保存到媒体库',
  })
  public async txtGenerate3DModel(@Req() request: IRequest, @Param('id') id: string, @Body() body: TextGenerate3DModelDto) {
    const { teamId, userId } = request;
    const { text, jsonFileName } = body;

    // 验证媒体文件是否存在且属于当前团队
    const media = await this.service.getMediaByIdAndTeamId(id, teamId);
    if (!media) {
      throw new NotFoundException('Media file not found or access denied');
    }

    try {
      const createdMedia = await this.service.TextGenerate3DModel(id, teamId, userId, media, text, jsonFileName);

      return new SuccessResponse({
        data: createdMedia,
      });
    } catch (error) {
      throw new BadRequestException(`Failed to generate 3D model: ${error.message}`);
    }
  }

  @Post(':id/txt-generate-json')
  @ApiOperation({
    summary: '使用 AI 根据文本生成JSON（神经模型）',
    description: '调用 monkey-tools-concept-design 的 text_to_function 工具根据文本生成JSON格式的神经模型数据，并将JSON保存到媒体库',
  })
  public async txtGenerateJson(@Req() request: IRequest, @Param('id') id: string, @Body() body: TextGenerateJsonDto) {
    const { teamId, userId } = request;
    const { text, jsonFileName } = body;

    // 验证媒体文件是否存在且属于当前团队
    const media = await this.service.getMediaByIdAndTeamId(id, teamId);
    if (!media) {
      throw new NotFoundException('Media file not found or access denied');
    }
    try {
      const createdMedia = await this.service.TextGenerateJson(id, teamId, userId, media, text, jsonFileName);
      return new SuccessResponse({ data: createdMedia });
    } catch (error) {
      throw new BadRequestException(`Failed to generate JSON: ${error.message}`);
    }
  }

  /**
   * 前端传入3D截图（图片URL），服务的进行 上传3D截图到S3
   */
  @Post(':id/3d-model-upload-image')
  @ApiOperation({ summary: '上传3D截图', description: '接收前端截图图片URL，上传到S3' })
  public async threeDImageUploadImage(@Req() request: IRequest, @Param('id') id: string, @Body() body: { imageUrl: string }) {
    const { teamId, userId } = request;
    const { imageUrl } = body ?? {};
    try {
      const createdMedia = await this.service.ThreeDImageUploadImage(teamId, userId, imageUrl);
      return new SuccessResponse({ data: createdMedia });
    } catch (error) {
      throw new BadRequestException(`Failed to upload 3D image: ${error.message}`);
    }
  }

  /**
   * 前端传入3D截图（图片URL），服务端进行 图片->文本
   */
  @Post(':id/3d-model-generate-txt')
  @ApiOperation({ summary: '3D截图生成文本', description: '接收前端截图图片URL，输出图片描述文本；可选直接更新指定媒体的description' })
  public async threeDImageGenerateTxt(@Req() request: IRequest, @Param('id') id: string, @Body() body: { imageUrl: string }) {
    const { teamId, userId } = request;
    const { imageUrl } = body ?? {};
    if (!imageUrl) {
      throw new BadRequestException('imageUrl is required');
    }
    try {
      const text = await this.service.ImageUrlGenerateTxt(id, teamId, userId, imageUrl);
      return new SuccessResponse({ data: { text } });
    } catch (error) {
      throw new BadRequestException(`Failed to generate text from 3D image: ${error.message}`);
    }
  }

  /**
   * 前端传入3D截图（图片URL），服务端进行 图片->Markdown
   */
  @Post(':id/3d-model-generate-markdown')
  @ApiOperation({ summary: '3D截图生成Markdown', description: '接收前端截图图片URL，输出Markdown描述；可选直接更新指定媒体的params.markdownDescription' })
  public async threeDImageGenerateMarkdown(@Req() request: IRequest, @Param('id') id: string, @Body() body: { imageUrl: string }) {
    const { teamId, userId } = request;
    const { imageUrl } = body ?? {};
    if (!imageUrl) {
      throw new BadRequestException('imageUrl is required');
    }
    try {
      const markdown = await this.service.ImageUrlGenerateMarkdown(id, teamId, userId, imageUrl);
      return new SuccessResponse({ data: { markdown } });
    } catch (error) {
      throw new BadRequestException(`Failed to generate markdown from image: ${error.message}`);
    }
  }

  /**
   * 前端传入3D截图（图片URL），服务端进行 图片->JSON（神经模型），并作为媒体文件保存
   */
  @Post(':id/3d-model-generate-json')
  @ApiOperation({ summary: '3D截图生成JSON（神经模型）', description: '接收前端截图图片URL，输出JSON并落库' })
  public async threeDImageGenerateJson(@Req() request: IRequest, @Param('id') id: string, @Body() body: { imageUrl: string; jsonFileName?: string }) {
    const { teamId, userId } = request;
    const { imageUrl, jsonFileName } = body ?? {};
    if (!imageUrl) {
      throw new BadRequestException('imageUrl is required');
    }
    // 验证媒体文件是否存在且属于当前团队
    const media = await this.service.getMediaByIdAndTeamId(id, teamId);
    if (!media) {
      throw new NotFoundException('Media file not found or access denied');
    }
    try {
      const createdMedia = await this.service.ImageUrlGenerateJson(id, teamId, userId, media, imageUrl, jsonFileName);
      return new SuccessResponse({ data: createdMedia });
    } catch (error) {
      throw new BadRequestException(`Failed to generate JSON from 3D image: ${error.message}`);
    }
  }
}
