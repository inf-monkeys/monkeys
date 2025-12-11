import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { DataViewService } from './data-view.service';
import {
  CreateDataViewDto,
  UpdateDataViewDto,
  MoveDataViewDto,
  QueryDataViewDto,
  DataViewResponseDto,
  DataViewTreeResponseDto,
} from './dto/data-view.dto';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { CurrentAdmin } from '../decorators/current-admin.decorator';
import { AdminUserDto } from '../auth/dto/admin-user.dto';

@ApiTags('Admin Data Management - Views')
@Controller('admin/data/views')
@UseGuards(AdminJwtGuard)
@ApiBearerAuth()
export class DataViewController {
  constructor(private readonly dataViewService: DataViewService) {}

  /**
   * 创建视图
   */
  @Post()
  @ApiOperation({ summary: '创建视图' })
  @ApiResponse({
    status: 201,
    description: '创建成功',
    type: DataViewResponseDto,
  })
  async createView(
    @CurrentAdmin() admin: AdminUserDto,
    @Body() dto: CreateDataViewDto,
  ): Promise<DataViewResponseDto> {
    return this.dataViewService.createView(admin.id, dto);
  }

  /**
   * 获取视图列表
   */
  @Get()
  @ApiOperation({ summary: '获取视图列表' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: [DataViewResponseDto],
  })
  async listViews(
    @CurrentAdmin() admin: AdminUserDto,
    @Query() query: QueryDataViewDto,
  ): Promise<DataViewResponseDto[]> {
    return this.dataViewService.listViews(admin.id, query);
  }

  /**
   * 获取树形结构
   */
  @Get('tree')
  @ApiOperation({ summary: '获取视图树形结构' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: DataViewTreeResponseDto,
  })
  async getViewTree(
    @CurrentAdmin() admin: AdminUserDto,
    @Query('teamId') teamId?: string,
  ): Promise<{ tree: DataViewResponseDto[] }> {
    const tree = await this.dataViewService.getViewTree(admin.id, teamId);
    return { tree };
  }

  /**
   * 获取视图详情
   */
  @Get(':id')
  @ApiOperation({ summary: '获取视图详情' })
  @ApiParam({ name: 'id', description: '视图 ID' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: DataViewResponseDto,
  })
  async getView(
    @Param('id') id: string,
    @CurrentAdmin() admin: AdminUserDto,
  ): Promise<DataViewResponseDto> {
    return this.dataViewService.getView(id, admin.id);
  }

  /**
   * 更新视图
   */
  @Put(':id')
  @ApiOperation({ summary: '更新视图' })
  @ApiParam({ name: 'id', description: '视图 ID' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
  })
  async updateView(
    @Param('id') id: string,
    @CurrentAdmin() admin: AdminUserDto,
    @Body() dto: UpdateDataViewDto,
  ): Promise<{ success: boolean }> {
    await this.dataViewService.updateView(id, admin.id, dto);
    return { success: true };
  }

  /**
   * 移动视图
   */
  @Put(':id/move')
  @ApiOperation({ summary: '移动视图到新的父视图' })
  @ApiParam({ name: 'id', description: '视图 ID' })
  @ApiResponse({
    status: 200,
    description: '移动成功',
  })
  async moveView(
    @Param('id') id: string,
    @CurrentAdmin() admin: AdminUserDto,
    @Body() dto: MoveDataViewDto,
  ): Promise<{ success: boolean }> {
    await this.dataViewService.moveView(id, admin.id, dto);
    return { success: true };
  }

  /**
   * 删除视图
   */
  @Delete(':id')
  @ApiOperation({ summary: '删除视图' })
  @ApiParam({ name: 'id', description: '视图 ID' })
  @ApiResponse({
    status: 200,
    description: '删除成功',
  })
  async deleteView(
    @Param('id') id: string,
    @CurrentAdmin() admin: AdminUserDto,
  ): Promise<{ success: boolean }> {
    await this.dataViewService.deleteView(id, admin.id);
    return { success: true };
  }
}
