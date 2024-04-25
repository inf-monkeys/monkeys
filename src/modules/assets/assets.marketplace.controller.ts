import { ListDto } from '@/common/dto/list.dto';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { AssetType } from '@/common/typings/asset';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { AssetsMarketplaceService } from './assets.marketplace.service';

@Controller('/assets/:assetType/marketplace')
export class AssetsMarketplaceController {
  constructor(private readonly assetsMarketplacService: AssetsMarketplaceService) {}

  @Get('')
  public async getMarketplaceList(@Param('assetType') assetType: AssetType, @Query() dto: ListDto) {
    const { list, totalCount } = await this.assetsMarketplacService.listMarketplaceAssets(assetType, dto);
    return new SuccessListResponse({
      data: list,
      total: totalCount,
      page: dto.page,
      limit: dto.limit,
    });
  }

  @Get('/tags')
  public async getMarketplaceTags(@Param('assetType') assetType: AssetType) {
    const data = await this.assetsMarketplacService.getMarketplaceTags(assetType);
    return new SuccessResponse({ data });
  }
}
