import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { DataBrowserService } from './data-browser.service';
import {
  QueryDataAssetDto,
  UpdateDataAssetPinOrderDto,
  DataAssetResponseDto,
  DataAssetListResponseDto,
  DataAssetNextPageResponseDto,
  QueryDataViewDto,
  DataViewResponseDto,
  DataViewTreeResponseDto,
} from './dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { IRequest } from '@/common/typings/request';

@ApiTags('Data Browser')
@Controller('data-browser')
@UseGuards(CompatibleAuthGuard)
@ApiBearerAuth()
export class DataBrowserController {
  constructor(private readonly dataBrowserService: DataBrowserService) {}

  /**
   * 获取视图树形结构
   */
  @Get('views/tree')
  @ApiOperation({ summary: '获取视图树形结构（只读）' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: DataViewTreeResponseDto,
  })
  async getViewTree(
    @Req() request: IRequest,
    @Query('teamId') teamId?: string,
  ): Promise<{ tree: DataViewResponseDto[] }> {
    const tree = await this.dataBrowserService.getViewTree(
      request.userId,
      teamId || request.teamId,
    );
    return { tree };
  }

  /**
   * 获取视图列表
   */
  @Get('views')
  @ApiOperation({ summary: '获取视图列表（只读）' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: [DataViewResponseDto],
  })
  async listViews(
    @Req() request: IRequest,
    @Query() query: QueryDataViewDto,
  ): Promise<DataViewResponseDto[]> {
    return this.dataBrowserService.listViews(
      request.userId,
      query,
      request.teamId,
    );
  }

  /**
   * 获取视图详情
   */
  @Get('views/:id')
  @ApiOperation({ summary: '获取视图详情（只读）' })
  @ApiParam({ name: 'id', description: '视图 ID' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: DataViewResponseDto,
  })
  async getView(
    @Param('id') id: string,
    @Req() request: IRequest,
  ): Promise<DataViewResponseDto> {
    return this.dataBrowserService.getView(id, request.userId);
  }

  /**
   * 获取数据资产列表
   */
  @Get('assets')
  @ApiOperation({ summary: '获取数据资产列表（只读）' })
  @ApiResponse({ status: 200, type: DataAssetListResponseDto })
  async getAssets(
    @Req() request: IRequest,
    @Query() dto: QueryDataAssetDto,
  ): Promise<DataAssetListResponseDto> {
    return this.dataBrowserService.getAssets(
      request.userId,
      dto,
      request.teamId,
    );
  }

  /**
   * 获取数据资产下一页（滚动加载，不返回 total）
   */
  @Get('assets/nextpage')
  @ApiOperation({ summary: '获取数据资产下一页（只读，不返回 total）' })
  @ApiResponse({ status: 200, type: DataAssetNextPageResponseDto })
  async getAssetsNextPage(
    @Req() request: IRequest,
    @Query() dto: QueryDataAssetDto,
  ): Promise<DataAssetNextPageResponseDto> {
    return this.dataBrowserService.getAssetsNextPage(
      request.userId,
      dto,
      request.teamId,
    );
  }

  /**
   * 获取单个数据资产
   */
  @Get('assets/:id')
  @ApiOperation({ summary: '获取数据资产详情（只读）' })
  @ApiResponse({ status: 200, type: DataAssetResponseDto })
  async getAsset(
    @Req() request: IRequest,
    @Param('id') id: string,
  ): Promise<DataAssetResponseDto> {
    return this.dataBrowserService.getAsset(request.userId, id);
  }

  /**
   * 设置资产置顶排序权重
   */
  @Put('assets/:id/pin')
  @ApiOperation({ summary: '设置数据资产置顶排序权重' })
  @ApiParam({ name: 'id', description: '资产 ID' })
  @ApiResponse({ status: 200, description: '设置成功' })
  async setAssetPinOrder(
    @Req() request: IRequest,
    @Param('id') id: string,
    @Body() dto: UpdateDataAssetPinOrderDto,
  ): Promise<{ success: boolean }> {
    await this.dataBrowserService.setAssetPinOrder(request.userId, id, dto.pinOrder, request.teamId);
    return { success: true };
  }
}
