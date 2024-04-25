import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { AssetType } from '@/common/typings/asset';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssetsPublishService } from './assets.publish.service';
import { PublishAssetDto } from './req/publish-asset.dto';

@Controller('assets')
@ApiTags('Assets/Publish')
@UseGuards(CompatibleAuthGuard)
export class AssetsPublishController {
  constructor(private readonly service: AssetsPublishService) {}

  @Post('/:assetType/publish/:assetId')
  @ApiOperation({
    description: '发布资产',
    summary: '发布资产',
  })
  public async publishAsset(@Req() req: IRequest, @Param('assetType') assetType: AssetType, @Param('assetId') assetId: string, @Body() body: PublishAssetDto) {
    const { teamId } = req;
    const data = await this.service.publishAsset(teamId, assetType, assetId, body.publishConfig);
    return new SuccessResponse({ data });
  }

  @ApiOperation({
    description: '克隆资产',
    summary: '克隆资产',
  })
  @Post('/:assetType/fork/:assetId')
  public async forkAsset(@Req() req: IRequest, @Param('assetType') assetType: AssetType, @Param('assetId') assetId: string) {
    const { teamId } = req;
    const data = await this.service.forkAsset(assetType, teamId, assetId);
    return new SuccessResponse({ data });
  }
}
