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
import { DataManagementV2Service } from './data-management-v2.service';
import {
  BatchUpdateViewSortV2Dto,
  CreateDataViewV2Dto,
  UpdateDataViewV2Dto,
  UpdateViewTagsV2Dto,
} from './dto/data-view-v2.dto';

@ApiTags('Admin Data Management V2 - Views')
@Controller('admin/data-v2/views')
@UseGuards(AdminJwtGuard)
@ApiBearerAuth()
export class DataViewV2Controller {
  constructor(private readonly service: DataManagementV2Service) {}

  @Get('tree')
  @ApiOperation({ summary: '获取视图树（V2）' })
  @ApiResponse({ status: 200 })
  async getViewTree(@Query('teamId') teamId?: string) {
    const tree = await this.service.getViewTree(teamId);
    return { tree };
  }

  @Post()
  @ApiOperation({ summary: '创建视图（V2）' })
  @ApiResponse({ status: 201 })
  async createView(@Query('teamId') teamId: string, @Body() dto: CreateDataViewV2Dto) {
    return this.service.createView(dto.teamId || teamId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新视图（V2）' })
  @ApiResponse({ status: 200 })
  async updateView(@Param('id') id: string, @Query('teamId') teamId: string, @Body() dto: UpdateDataViewV2Dto) {
    return this.service.updateView(dto.teamId || teamId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除视图（V2）' })
  @ApiResponse({ status: 204 })
  async deleteView(@Param('id') id: string, @Query('teamId') teamId?: string) {
    return this.service.deleteView(teamId, id);
  }

  @Post('batch/sort')
  @ApiOperation({ summary: '批量更新视图排序（V2）' })
  @ApiResponse({ status: 200 })
  async batchUpdateSort(@Body() dto: BatchUpdateViewSortV2Dto) {
    return this.service.batchUpdateViewSort(dto.teamId, dto.items);
  }

  @Get(':id/tags')
  @ApiOperation({ summary: '获取视图默认标签（V2）' })
  @ApiResponse({ status: 200 })
  async getViewTags(@Param('id') id: string, @Query('teamId') teamId?: string) {
    return this.service.getViewTags(teamId, id);
  }

  @Put(':id/tags')
  @ApiOperation({ summary: '设置视图默认标签（V2）' })
  @ApiResponse({ status: 200 })
  async setViewTags(@Param('id') id: string, @Query('teamId') teamId: string, @Body() dto: UpdateViewTagsV2Dto) {
    return this.service.updateView(dto.teamId || teamId, id, { tagIds: dto.tagIds || [] });
  }
}
