import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { CurrentAdmin } from '../decorators/current-admin.decorator';
import { AdminUserDto } from '../auth/dto/admin-user.dto';
import { DataManagementV2Service } from './data-management-v2.service';
import {
  BatchDeleteDataAssetV2Dto,
  CreateDataAssetV2Dto,
  QueryDataAssetV2Dto,
  UpdateDataAssetV2Dto,
} from './dto/data-asset-v2.dto';

@ApiTags('Admin Data Management V2 - Assets')
@Controller('admin/data-v2')
@UseGuards(AdminJwtGuard)
@ApiBearerAuth()
export class DataAssetV2Controller {
  constructor(private readonly service: DataManagementV2Service) {}

  @Get()
  @ApiOperation({ summary: '获取数据资产列表（V2）' })
  @ApiResponse({ status: 200 })
  async getAssets(@CurrentAdmin() admin: AdminUserDto, @Query() dto: QueryDataAssetV2Dto) {
    return this.service.getAssets({
      adminId: admin.id,
      teamId: dto.teamId,
      viewId: dto.viewId,
      name: dto.name,
      tags: dto.tags,
      page: dto.page,
      pageSize: dto.pageSize,
    });
  }

  @Get('nextpage')
  @ApiOperation({ summary: '获取数据资产下一页（V2）' })
  @ApiResponse({ status: 200 })
  async getAssetsNextPage(@CurrentAdmin() admin: AdminUserDto, @Query() dto: QueryDataAssetV2Dto) {
    return this.service.getAssetsNextPage({
      adminId: admin.id,
      teamId: dto.teamId,
      viewId: dto.viewId,
      name: dto.name,
      tags: dto.tags,
      pageToken: dto.pageToken,
      pageSize: dto.pageSize,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取数据资产详情（V2）' })
  @ApiResponse({ status: 200 })
  async getAsset(@CurrentAdmin() admin: AdminUserDto, @Param('id') id: string, @Query('teamId') teamId?: string) {
    return this.service.getAsset(admin.id, teamId, id);
  }

  @Post()
  @ApiOperation({ summary: '创建数据资产（V2）' })
  @ApiResponse({ status: 201 })
  async createAsset(@CurrentAdmin() admin: AdminUserDto, @Query('teamId') teamId: string, @Body() dto: CreateDataAssetV2Dto) {
    return this.service.createAsset(admin.id, {
      teamId: dto.teamId || teamId,
      payload: dto,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: '更新数据资产（V2）' })
  @ApiResponse({ status: 200 })
  async updateAsset(
    @CurrentAdmin() admin: AdminUserDto,
    @Param('id') id: string,
    @Query('teamId') teamId: string,
    @Body() dto: UpdateDataAssetV2Dto,
  ) {
    return this.service.updateAsset(admin.id, {
      teamId: dto.teamId || teamId,
      id,
      payload: dto,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除数据资产（V2）' })
  @ApiResponse({ status: 204 })
  async deleteAsset(@CurrentAdmin() admin: AdminUserDto, @Param('id') id: string, @Query('teamId') teamId?: string) {
    await this.service.deleteAsset(admin.id, teamId, id);
  }

  @Post('batch-delete')
  @ApiOperation({ summary: '批量删除数据资产（V2）' })
  @ApiResponse({ status: 204 })
  async batchDeleteAssets(@CurrentAdmin() admin: AdminUserDto, @Body() dto: BatchDeleteDataAssetV2Dto) {
    await this.service.batchDeleteAssets(admin.id, dto.teamId, dto.ids);
  }
}
