import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MarketplaceService } from '../services/marketplace.service';
import { IStagedAsset } from '../types';

@ApiTags('Marketplace')
@Controller('marketplace/team')
@UseGuards(CompatibleAuthGuard)
export class MarketplaceTeamController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Post('/exportAssetsByAssetList')
  @ApiOperation({ summary: '导出' })
  async exportAssetsByAssetList(
    @Req() req: IRequest,
    @Body()
    body: {
      assets: IStagedAsset[];
    },
  ) {
    const { assets } = body;

    const data = await this.marketplaceService.getAssetSnapshotByStagedAssets(assets);

    return new SuccessResponse({ data });
  }
}
