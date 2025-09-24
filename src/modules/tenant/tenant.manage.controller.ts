import { TenantStatisticsAuthGuard } from '@/common/guards/tenant-statistics.guard';
import { SuccessResponse } from '@/common/response';
import { Body, Controller, Get, InternalServerErrorException, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { reloadMarketplaceData } from '../marketplace/services/marketplace.data';
import { TenantManageService } from './tenant.manage.service';

@Controller('tenant/manage')
@ApiTags('Tenant Manage')
@UseGuards(TenantStatisticsAuthGuard)
export class TenantManageController {
  constructor(private readonly tenantManageService: TenantManageService) {}

  @Post('/deleteAllTeamsExceptDefault')
  @ApiOperation({
    summary: '删除所有团队，除了默认团队',
    description: '删除所有团队，除了默认团队',
  })
  async deleteAllTeamsExceptDefault(@Body() body: { soft?: boolean }) {
    const result = await this.tenantManageService.deleteAllTeamsExceptDefault(body.soft);
    return new SuccessResponse({
      data: result,
    });
  }

  @Post('/initAllTeams')
  @ApiOperation({
    summary: '初始化所有团队',
    description: '初始化所有团队',
  })
  async initAllTeams(@Body() body: { deleteAllAssets?: boolean }, @Req() req: Request, @Res() res: Response) {
    // 检查是否请求流式响应
    const stream = req.headers.accept?.includes('text/event-stream');

    if (!stream) {
      // 非流式响应，保持原有逻辑
      const result = await this.tenantManageService.initAllTeams(body.deleteAllAssets);
      return new SuccessResponse({
        data: result,
      });
    }

    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    // 发送初始状态
    res.write(
      `data: ${JSON.stringify({
        type: 'progress',
        data: {
          status: 'starting',
          message: '开始初始化所有团队...',
          progress: 0,
          total: 0,
          current: 0,
        },
      })}\n\n`,
    );

    try {
      // 调用服务方法，传入进度回调
      await this.tenantManageService.initAllTeamsWithProgress(body.deleteAllAssets, (progress) => {
        res.write(
          `data: ${JSON.stringify({
            type: 'progress',
            data: progress,
          })}\n\n`,
        );
      });

      // 发送完成状态
      res.write(
        `data: ${JSON.stringify({
          type: 'complete',
          data: {
            status: 'completed',
            message: '所有团队初始化完成',
            progress: 100,
            total: 0,
            current: 0,
          },
        })}\n\n`,
      );
    } catch (error) {
      // 发送错误状态
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          data: {
            status: 'error',
            message: `初始化失败: ${error.message}`,
            error: error.message,
          },
        })}\n\n`,
      );
    } finally {
      res.end();
    }
  }

  // 新增SSE端点
  @Get('/initAllTeams/progress/:taskId')
  @ApiOperation({
    summary: '获取初始化进度',
    description: '通过SSE获取团队初始化的实时进度',
  })
  async getInitProgress(@Param('taskId') taskId: string, @Req() req: Request, @Res() res: Response) {
    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    // 订阅进度更新
    const unsubscribe = this.tenantManageService.subscribeToProgress(taskId, (progress) => {
      res.write(
        `data: ${JSON.stringify({
          type: 'progress',
          data: progress,
        })}\n\n`,
      );
    });

    // 监听连接关闭
    req.on('close', () => {
      unsubscribe();
    });
  }

  @Post('/reloadMarketplaceData')
  @ApiOperation({
    summary: '重新加载市场数据',
    description: '重新加载市场数据',
  })
  async reloadMarketplaceData() {
    const result = await reloadMarketplaceData();
    return result
      ? new SuccessResponse({
          data: result,
        })
      : new InternalServerErrorException('重新加载市场数据失败');
  }
}
