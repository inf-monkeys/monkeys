import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MarketplaceService } from '../services/marketplace.service';

@ApiTags('Marketplace')
@Controller('marketplace/apps')
@UseGuards(CompatibleAuthGuard)
export class MarketplacePublicController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get()
  @ApiOperation({ summary: 'Browse marketplace apps' })
  async browseApps(@Query() listDto: ListDto) {
    const { list, total } = await this.marketplaceService.listApprovedApps(listDto);
    return new SuccessListResponse({
      data: list,
      total,
      page: listDto.page,
      limit: listDto.limit,
    });
  }

  @Get('/categories')
  @ApiOperation({ summary: '获取所有唯一的分类列表' })
  async getAllCategories() {
    const categories = await this.marketplaceService.getAllCategories();
    return new SuccessResponse({ data: categories });
  }

  @Get(':appId')
  @ApiOperation({ summary: 'Get app details' })
  async getAppDetails(@Param('appId') appId: string) {
    const app = await this.marketplaceService.getAppDetails(appId);
    return new SuccessResponse({ data: app });
  }

  @Post('/install/:versionId')
  @ApiOperation({ summary: 'Install an app version' })
  async installApp(@Req() req: IRequest, @Param('versionId') versionId: string) {
    const { teamId, userId } = req;
    const installedApp = await this.marketplaceService.installApp(versionId, teamId, userId);
    return new SuccessResponse({ data: installedApp });
  }
}
