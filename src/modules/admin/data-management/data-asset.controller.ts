import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { DataAssetService } from './data-asset.service';
import {
  CreateDataAssetDto,
  UpdateDataAssetDto,
  QueryDataAssetDto,
  DataAssetResponseDto,
  DataAssetListResponseDto,
  DataAssetNextPageResponseDto,
  BatchUpdateStatusDto,
  UpdateDataAssetPinOrderDto,
} from './dto/data-asset.dto';
import { AdminOrTenantGuard } from '@/common/guards/admin-or-tenant.guard';
import { AdminUserDto } from '../auth/dto/admin-user.dto';

@ApiTags('Admin Data Management - Assets')
@Controller('admin/data')
@UseGuards(AdminOrTenantGuard)
@ApiBearerAuth()
export class DataAssetController {
  constructor(private readonly dataAssetService: DataAssetService) {}

  @Post()
  @ApiOperation({ summary: '创建数据资产（支持管理员和租户鉴权）' })
  @ApiResponse({ status: 201, type: DataAssetResponseDto })
  async createAsset(
    @Req() req: Request & { adminUser?: AdminUserDto; authType?: string },
    @Body() dto: CreateDataAssetDto,
  ): Promise<DataAssetResponseDto> {
    const userId = req.authType === 'tenant' ? null : req.adminUser?.id;
    return this.dataAssetService.createAsset(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: '获取数据资产列表（支持管理员和租户鉴权）' })
  @ApiResponse({ status: 200, type: DataAssetListResponseDto })
  async getAssets(
    @Req() req: Request & { adminUser?: AdminUserDto; authType?: string },
    @Query() dto: QueryDataAssetDto,
  ): Promise<DataAssetListResponseDto> {
    // 如果是租户鉴权，userId 传 null 或特殊标识，由 Service 层处理
    const userId = req.authType === 'tenant' ? null : req.adminUser?.id;
    return this.dataAssetService.getAssets(userId, dto);
  }

  @Get('nextpage')
  @ApiOperation({ summary: '获取数据资产下一页（不返回 total，支持管理员和租户鉴权）' })
  @ApiResponse({ status: 200, type: DataAssetNextPageResponseDto })
  async getAssetsNextPage(
    @Req() req: Request & { adminUser?: AdminUserDto; authType?: string },
    @Query() dto: QueryDataAssetDto,
  ): Promise<DataAssetNextPageResponseDto> {
    const userId = req.authType === 'tenant' ? null : req.adminUser?.id;
    return this.dataAssetService.getAssetsNextPage(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取数据资产详情（支持管理员和租户鉴权）' })
  @ApiResponse({ status: 200, type: DataAssetResponseDto })
  async getAsset(
    @Req() req: Request & { adminUser?: AdminUserDto; authType?: string },
    @Param('id') id: string,
  ): Promise<DataAssetResponseDto> {
    const userId = req.authType === 'tenant' ? null : req.adminUser?.id;
    return this.dataAssetService.getAsset(userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新数据资产（支持管理员和租户鉴权）' })
  @ApiResponse({ status: 200, type: DataAssetResponseDto })
  async updateAsset(
    @Req() req: Request & { adminUser?: AdminUserDto; authType?: string },
    @Param('id') id: string,
    @Body() dto: UpdateDataAssetDto,
  ): Promise<DataAssetResponseDto> {
    const userId = req.authType === 'tenant' ? null : req.adminUser?.id;
    return this.dataAssetService.updateAsset(userId, id, dto);
  }

  @Put(':id/pin')
  @ApiOperation({ summary: '设置数据资产置顶排序权重（支持管理员和租户鉴权）' })
  @ApiResponse({ status: 200, description: '设置成功' })
  async setAssetPinOrder(
    @Req() req: Request & { adminUser?: AdminUserDto; authType?: string },
    @Param('id') id: string,
    @Body() dto: UpdateDataAssetPinOrderDto,
  ): Promise<{ success: boolean }> {
    const userId = req.authType === 'tenant' ? null : req.adminUser?.id;
    await this.dataAssetService.setAssetPinOrder(userId, id, dto.pinOrder);
    return { success: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除数据资产（支持管理员和租户鉴权）' })
  @ApiResponse({ status: 204 })
  async deleteAsset(
    @Req() req: Request & { adminUser?: AdminUserDto; authType?: string },
    @Param('id') id: string,
  ): Promise<void> {
    const userId = req.authType === 'tenant' ? null : req.adminUser?.id;
    return this.dataAssetService.deleteAsset(userId, id);
  }

  @Post('batch-delete')
  @ApiOperation({ summary: '批量删除数据资产（支持管理员和租户鉴权）' })
  @ApiResponse({ status: 204 })
  async batchDeleteAssets(
    @Req() req: Request & { adminUser?: AdminUserDto; authType?: string },
    @Body('ids') ids: string[],
  ): Promise<void> {
    const userId = req.authType === 'tenant' ? null : req.adminUser?.id;
    return this.dataAssetService.batchDeleteAssets(userId, ids);
  }

  @Post('batch-update-status')
  @ApiOperation({ summary: '批量更新数据资产状态（支持管理员和租户鉴权）' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async batchUpdateStatus(
    @Req() req: Request & { adminUser?: AdminUserDto; authType?: string },
    @Body() dto: BatchUpdateStatusDto,
  ): Promise<{ success: boolean }> {
    const userId = req.authType === 'tenant' ? null : req.adminUser?.id;
    await this.dataAssetService.batchUpdateStatus(userId, dto.ids, dto.status);
    return { success: true };
  }
}
