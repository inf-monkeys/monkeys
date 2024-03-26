import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssetsFilterService } from './assets.filter.service';
import { ListAssetFilterDto } from './req/list-asset-filter.dto';
import { UpdateAssetFilterDto } from './req/update-asset-filter.dto';

@Controller('assets')
@ApiTags('Assets/Filter')
@UseGuards(CompatibleAuthGuard)
export class AssetsFiltersController {
  constructor(private readonly service: AssetsFilterService) {}

  @ApiOperation({
    description: '获取资产分组过滤规则',
    summary: '获取资产分组过滤规则',
  })
  @Get('/filters')
  public async listAssetFilters(@Req() request: IRequest, @Query() query: ListAssetFilterDto) {
    const { teamId } = request;
    const { type } = query;
    const data = await this.service.listFilters(teamId, type);
    return new SuccessResponse({ data });
  }

  @Post('/filters')
  @ApiOperation({
    description: '创建资产分组过滤规则',
    summary: '创建资产分组过滤规则',
  })
  public async createAssetFilter(@Req() request: IRequest, @Body() body: UpdateAssetFilterDto) {
    const { teamId, userId } = request;
    const data = await this.service.createAssetFilter(teamId, userId, body);
    return new SuccessResponse({ data });
  }

  @Put('/filters/:filterId')
  @ApiOperation({
    description: '更新资产分组过滤规则',
    summary: '更新资产分组过滤规则',
  })
  public async updateAssetFilter(@Req() request: IRequest, @Body() body: UpdateAssetFilterDto, @Param('filterId') filterId: string) {
    const { teamId } = request;
    const data = await this.service.updateAssetFilter(teamId, filterId, body);
    return new SuccessResponse({ data });
  }

  @Delete('/filters/:filterId')
  @ApiOperation({
    description: '删除资产分组过滤规则',
    summary: '删除资产分组过滤规则',
  })
  public async deleteAssetFilter(@Req() request: IRequest, @Param('filterId') filterId: string) {
    const { teamId } = request;
    const data = await this.service.deleteAssetFilter(teamId, filterId);
    return new SuccessResponse({ data });
  }
}
