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
} from '@nestjs/common';
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
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { CurrentAdmin } from '../decorators/current-admin.decorator';
import { AdminUserDto } from '../auth/dto/admin-user.dto';

@ApiTags('Admin Data Management - Assets')
@Controller('admin/data')
@UseGuards(AdminJwtGuard)
@ApiBearerAuth()
export class DataAssetController {
  constructor(private readonly dataAssetService: DataAssetService) {}

  @Post()
  @ApiOperation({ summary: '创建数据资产' })
  @ApiResponse({ status: 201, type: DataAssetResponseDto })
  async createAsset(
    @CurrentAdmin() admin: AdminUserDto,
    @Body() dto: CreateDataAssetDto,
  ): Promise<DataAssetResponseDto> {
    return this.dataAssetService.createAsset(admin.id, dto);
  }

  @Get()
  @ApiOperation({ summary: '获取数据资产列表' })
  @ApiResponse({ status: 200, type: DataAssetListResponseDto })
  async getAssets(
    @CurrentAdmin() admin: AdminUserDto,
    @Query() dto: QueryDataAssetDto,
  ): Promise<DataAssetListResponseDto> {
    return this.dataAssetService.getAssets(admin.id, dto);
  }

  @Get('nextpage')
  @ApiOperation({ summary: '获取数据资产下一页（不返回 total）' })
  @ApiResponse({ status: 200, type: DataAssetNextPageResponseDto })
  async getAssetsNextPage(
    @CurrentAdmin() admin: AdminUserDto,
    @Query() dto: QueryDataAssetDto,
  ): Promise<DataAssetNextPageResponseDto> {
    return this.dataAssetService.getAssetsNextPage(admin.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取数据资产详情' })
  @ApiResponse({ status: 200, type: DataAssetResponseDto })
  async getAsset(
    @CurrentAdmin() admin: AdminUserDto,
    @Param('id') id: string,
  ): Promise<DataAssetResponseDto> {
    return this.dataAssetService.getAsset(admin.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新数据资产' })
  @ApiResponse({ status: 200, type: DataAssetResponseDto })
  async updateAsset(
    @CurrentAdmin() admin: AdminUserDto,
    @Param('id') id: string,
    @Body() dto: UpdateDataAssetDto,
  ): Promise<DataAssetResponseDto> {
    return this.dataAssetService.updateAsset(admin.id, id, dto);
  }

  @Put(':id/pin')
  @ApiOperation({ summary: '设置数据资产置顶排序权重' })
  @ApiResponse({ status: 200, description: '设置成功' })
  async setAssetPinOrder(
    @CurrentAdmin() admin: AdminUserDto,
    @Param('id') id: string,
    @Body() dto: UpdateDataAssetPinOrderDto,
  ): Promise<{ success: boolean }> {
    await this.dataAssetService.setAssetPinOrder(admin.id, id, dto.pinOrder);
    return { success: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除数据资产' })
  @ApiResponse({ status: 204 })
  async deleteAsset(
    @CurrentAdmin() admin: AdminUserDto,
    @Param('id') id: string,
  ): Promise<void> {
    return this.dataAssetService.deleteAsset(admin.id, id);
  }

  @Post('batch-delete')
  @ApiOperation({ summary: '批量删除数据资产' })
  @ApiResponse({ status: 204 })
  async batchDeleteAssets(
    @CurrentAdmin() admin: AdminUserDto,
    @Body('ids') ids: string[],
  ): Promise<void> {
    return this.dataAssetService.batchDeleteAssets(admin.id, ids);
  }

  @Post('batch-update-status')
  @ApiOperation({ summary: '批量更新数据资产状态' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async batchUpdateStatus(
    @CurrentAdmin() admin: AdminUserDto,
    @Body() dto: BatchUpdateStatusDto,
  ): Promise<{ success: boolean }> {
    await this.dataAssetService.batchUpdateStatus(admin.id, dto.ids, dto.status);
    return { success: true };
  }
}
