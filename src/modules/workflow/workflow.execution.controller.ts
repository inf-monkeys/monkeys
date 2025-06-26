import { config } from '@/common/config';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { WorkflowAuthGuard } from '@/common/guards/workflow-auth.guard';
import { logger } from '@/common/logger';
import { SuccessResponse } from '@/common/response';
import { S3Helpers } from '@/common/s3';
import { IRequest } from '@/common/typings/request';
import { extractImageUrls, flattenKeys } from '@/common/utils';
import { getFileExtensionFromUrl } from '@/common/utils/file';
import { calculateMd5FromArrayBuffer } from '@/common/utils/markdown-image-utils';
import { MediaSource } from '@/database/entities/assets/media/media-file';
import { WorkflowTriggerType } from '@/database/entities/workflow/workflow-trigger';
import { MediaFileService } from '@/modules/assets/media/media.service';
import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import axios from 'axios';
import { SearchWorkflowExecutionsDto } from './dto/req/search-workflow-execution.dto';
import { StartWorkflowSyncDto } from './dto/req/start-workflow-sync.dto';
import { StartWorkflowDto } from './dto/req/start-workflow.dto';
import { UpdateTaskStatusDto } from './dto/req/update-task-status.dto';
import { DebugWorkflowDto } from './interfaces';
import { WorkflowExecutionService } from './workflow.execution.service';

@Controller('/workflow')
@ApiTags('Workflows/Execution')
@UseGuards(WorkflowAuthGuard, CompatibleAuthGuard)
export class WorkflowExecutionController {
  constructor(
    private readonly service: WorkflowExecutionService,
    private readonly mediaFileService: MediaFileService,
  ) {}

  @Post('/executions/search')
  @ApiOperation({
    summary: '搜索 workflow 的执行记录',
    description: '搜索 workflow 的执行记录',
  })
  public async searchWorkflowExecutions(@Req() req: IRequest, @Body() body: SearchWorkflowExecutionsDto) {
    const { teamId } = req;
    const result = await this.service.searchWorkflowExecutions(teamId, body);
    return new SuccessResponse({
      data: result,
    });
  }

  @Get('/executions/:workflowInstanceId/')
  @ApiOperation({
    summary: '获取某一次 workflow 执行实例的执行详情',
    description: '获取某一次 workflow 执行实例的执行详情',
  })
  public async getWorkflowInstanceExecutionDetail(@Req() req: IRequest, @Param('workflowInstanceId') workflowInstanceId: string) {
    const { teamId } = req;
    const result = await this.service.getWorkflowExecutionDetail(teamId, workflowInstanceId);
    return new SuccessResponse({
      data: result,
    });
  }

  @Delete('/executions/:workflowInstanceId/')
  @ApiOperation({
    summary: '删除某一次 workflow 执行实例',
    description: '删除某一次 workflow 执行实例',
  })
  public async deleteWorkflowInstanceExecution(@Req() req: IRequest, @Param('workflowInstanceId') workflowInstanceId: string) {
    const { teamId } = req;
    await this.service.deleteWorkflowExecution(teamId, workflowInstanceId);
    return new SuccessResponse({
      data: true,
    });
  }

  @Get('/executions/:workflowInstanceId/simple')
  @ApiOperation({
    summary: '获取某一次 workflow 执行实例的执行信息',
    description: '获取某一次 workflow 执行实例的执行信息',
  })
  public async getWorkflowInstanceExecutionSimpleDetail(@Req() req: IRequest, @Param('workflowInstanceId') workflowInstanceId: string) {
    const { teamId } = req;
    const result = await this.service.getWorkflowExecutionSimpleDetail(teamId, workflowInstanceId);
    return new SuccessResponse({
      data: result,
    });
  }

  @Get('/executions/:workflowId/outputs')
  @ApiOperation({
    summary: '获取 workflow 的执行输出',
    description: '获取 workflow 的执行输出',
  })
  public async getWorkflowExecutionOutputs(@Req() req: IRequest, @Param('workflowId') workflowId: string, @Query() query: { page: string; limit: string; orderBy: 'DESC' | 'ASC'; orderKey?: string }) {
    const { page = 1, limit = 10, orderBy = 'DESC', orderKey } = query;
    const result =
      workflowId === 'all'
        ? await this.service.getAllWorkflowsExecutionOutputs(req.teamId, { page: Number(page) || 1, limit: Number(limit) || 10, orderBy, orderKey })
        : await this.service.getWorkflowExecutionOutputs(workflowId, Number(page) || 1, Number(limit) || 10);
    return {
      code: 200,
      message: 'ok',
      ...result,
    };
  }

  @Get('/executions/:workflowId/thumbnails')
  @ApiOperation({
    summary: '获取 workflow 的缩略图列表',
    description: '获取 workflow 的缩略图列表',
  })
  public async getWorkflowExecutionThumbnails(@Req() req: IRequest, @Param('workflowId') workflowId: string, @Query() query: { limit: string }) {
    const { limit = 5 } = query;
    const result = await this.service.getWorkflowExecutionThumbnails(workflowId, Number(limit) || 5);
    return new SuccessResponse({
      data: result,
    });
  }

  @Post('/executions/:workflowId/get-instance-by-image-url')
  @ApiOperation({
    summary: '根据图片 URL 获取 workflow 实例',
    description: '根据图片 URL 获取 workflow 实例',
  })
  public async getWorkflowInstanceByImageUrl(@Req() req: IRequest, @Param('workflowId') workflowId: string, @Body() body: { imageUrl: string; page?: number; limit: number }) {
    const { teamId } = req;
    const { imageUrl, page = 1, limit = 500 } = body;
    const result = await this.service.getWorkflowInstanceByImageUrl(teamId, workflowId, imageUrl, Number(page) || 1, Number(limit) || 500);
    return new SuccessResponse({
      data: result,
    });
  }

  @Post('/executions/:workflowId/start-sync')
  @ApiOperation({
    summary: '运行 workflow',
    description: '运行 workflow',
  })
  public async startWorkflowSync(@Req() req: IRequest, @Param('workflowId') workflowId: string, @Body() body: StartWorkflowSyncDto) {
    const { teamId, userId, apikey } = req;
    const { inputData, version } = body;
    const workflowInstanceId = await this.service.startWorkflow({
      teamId,
      userId,
      workflowId,
      inputData,
      version,
      triggerType: WorkflowTriggerType.MANUALLY,
      apiKey: apikey,
    });
    return await this.service.waitForWorkflowResult(teamId, workflowInstanceId);
  }

  @Post('/executions/:workflowId/start')
  @ApiOperation({
    summary: '运行 workflow',
    description: '运行 workflow',
  })
  public async startWorkflow(@Req() req: IRequest, @Param('workflowId') workflowId: string, @Body() body: StartWorkflowDto) {
    const { teamId, userId } = req;
    const { inputData, version, chatSessionId, waitForWorkflowFinished = false, group } = body;
    const workflowInstanceId = await this.service.startWorkflow({
      teamId,
      userId,
      workflowId,
      inputData,
      version,
      triggerType: WorkflowTriggerType.MANUALLY,
      chatSessionId,
      group,
    });

    if (waitForWorkflowFinished) {
      const result = await this.service.waitForWorkflowResult(teamId, workflowInstanceId);

      // 异步处理工作流结果中的图片（不阻塞响应）
      this.processWorkflowImages(result, teamId, userId).catch((error) => {
        logger.error('Background image processing failed:', error);
      });

      return new SuccessResponse({
        data: result,
      });
    } else {
      return new SuccessResponse({
        data: {
          workflowInstanceId,
        },
      });
    }
  }

  @Post('/executions/:workflowId/debug')
  @ApiOperation({
    summary: '调试 workflow',
    description: '调试 workflow',
  })
  public async debugWorkflow(@Req() req: IRequest, @Param('workflowId') workflowId: string, @Body() body: DebugWorkflowDto) {
    const { teamId, userId } = req;
    const { inputData, tasks } = body;
    const workflowInstanceId = await this.service.debugWorkflow({
      teamId,
      userId,
      workflowId,
      inputData,
      tasks,
    });
    return new SuccessResponse({
      data: workflowInstanceId,
    });
  }

  @Post('/executions/:workflowInstanceId/pause')
  @ApiOperation({
    summary: '暂停 workflow',
    description: '暂停 workflow',
  })
  public async pauseWorkflow(@Param('workflowInstanceId') workflowInstanceId: string) {
    const result = await this.service.pauseWorkflow(workflowInstanceId);
    return new SuccessResponse({
      data: result,
    });
  }

  @Post('/executions/:workflowInstanceId/resume')
  @ApiOperation({
    summary: '恢复执行 workflow',
    description: '恢复执行 workflow',
  })
  public async resumeWorkflow(@Param('workflowInstanceId') workflowInstanceId: string) {
    const result = await this.service.resumeWorkflow(workflowInstanceId);
    return new SuccessResponse({
      data: result,
    });
  }

  @Post('/executions/:workflowInstanceId/terminate')
  @ApiOperation({
    summary: '终止 workflow',
    description: '终止 workflow',
  })
  public async terminateWorkflow(@Param('workflowInstanceId') workflowInstanceId: string) {
    const result = await this.service.terminateWorkflow(workflowInstanceId);
    return new SuccessResponse({
      data: result,
    });
  }

  @Post('/executions/:workflowInstanceId/retry')
  @ApiOperation({
    summary: '重试 workflow',
    description: '重试 workflow（workflow 失败的情况下）',
  })
  public async retryWorkflow(@Param('workflowInstanceId') workflowInstanceId: string) {
    const result = await this.service.retryWorkflow(workflowInstanceId);
    return new SuccessResponse({
      data: result,
    });
  }

  @Post('/executions/:workflowInstanceId/tasks/:taskId')
  @ApiOperation({
    summary: '修改 workflow task 状态',
  })
  public async updateTaskStatus(@Param('workflowInstanceId') workflowInstanceId: string, @Param('taskId') taskId: string, @Body() dto: UpdateTaskStatusDto) {
    const result = await this.service.updateTaskStatus(workflowInstanceId, taskId, dto);
    return new SuccessResponse({
      data: result,
    });
  }

  /**
   * 处理工作流结果中的图片，转存到S3并创建媒体记录
   */
  private async processWorkflowImages(result: Record<string, any>, teamId: string, userId: string): Promise<void> {
    try {
      // 1. 扁平化结果对象，提取所有图片URL
      const flattenedResult = flattenKeys(result);
      const allImageUrls = new Set<string>();

      Object.values(flattenedResult).forEach((value) => {
        const imageUrls = extractImageUrls(value);
        imageUrls.forEach((url) => allImageUrls.add(url));
      });

      if (allImageUrls.size === 0) {
        return; // 没有图片，直接返回
      }

      logger.info(`Found ${allImageUrls.size} unique images in workflow result`);

      // 2. 并行处理所有图片（限制并发数）
      const imageArray = Array.from(allImageUrls);
      const batchSize = 5; // 限制并发数为5

      for (let i = 0; i < imageArray.length; i += batchSize) {
        const batch = imageArray.slice(i, i + batchSize);
        const batchPromises = batch.map((url) => this.processSingleImage(url, teamId, userId));
        await Promise.all(batchPromises);
      }

      logger.info(`Completed processing workflow images`);
    } catch (error) {
      logger.error('Error in processWorkflowImages:', error);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 处理单张图片的转存
   */
  private async processSingleImage(url: string, teamId: string, userId: string): Promise<void> {
    try {
      // 1. 下载图片
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30秒超时
      });
      const buffer = response.data;

      // 2. 计算MD5
      const md5 = await calculateMd5FromArrayBuffer(buffer);
      if (!md5) {
        logger.error(`Failed to calculate MD5 for image: ${url}`);
        return;
      }

      // 3. 检查是否已存在相同MD5的媒体文件
      const existingMedia = await this.mediaFileService.getMediaByMd5(teamId, md5);
      if (existingMedia) {
        logger.info(`Image already exists in database: ${url}, skipping`);
        return;
      }

      // 4. 上传到S3
      const s3Helpers = new S3Helpers();
      const fileExtension = getFileExtensionFromUrl(url);
      const s3Key = `workflow-output-images/${md5}${fileExtension ? '.' + fileExtension : ''}`;
      const s3UploadedUrl = await s3Helpers.uploadFile(buffer, s3Key);

      // 5. 获取最终URL（考虑私有桶的签名URL）
      const finalUrl = config.s3.isPrivate ? await s3Helpers.getSignedUrl(s3Key) : s3UploadedUrl;

      // 6. 创建媒体记录
      await this.mediaFileService.createMedia(teamId, userId, {
        type: 'image',
        displayName: `Workflow Output - ${new Date().toISOString()}`,
        url: finalUrl,
        source: MediaSource.OUTPUT, // source = 4
        params: {
          originalUrl: url,
          workflowGenerated: true,
          s3Key: s3Key,
        },
        size: buffer.byteLength,
        md5,
      });

      logger.info(`Successfully processed and stored image: ${url} -> ${finalUrl}`);
    } catch (error) {
      logger.error(`Failed to process image ${url}:`, error);
      // 单个图片失败不影响其他图片的处理
    }
  }
}
