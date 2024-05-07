import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { AssetType } from '@/common/typings/asset';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssetsTagService } from './assets.tag.service';
import { AddTagToAssetDto } from './req/add-tag-to-asset.dto';
import { CreateTagDto } from './req/create-tag.dto';
import { RemoveAssetTags } from './req/remove-asset-tags.dto';
import { UpdateTagDto } from './req/update-tag.dto';

@Controller('assets')
@ApiTags('Assets/Tag')
@UseGuards(CompatibleAuthGuard)
export class AssetsTagController {
  constructor(private readonly service: AssetsTagService) {}

  @Get('/tags')
  @ApiOperation({
    description: '获取资产标签',
    summary: '获取资产标签',
  })
  public async listTags(@Req() req: IRequest) {
    const { teamId } = req;
    const data = await this.service.listTags(teamId);
    return new SuccessResponse({ data });
  }

  @Post('/tags')
  async createTag(@Req() req: IRequest, @Body() body: CreateTagDto) {
    const { teamId } = req;
    const { name, color } = body;
    const data = await this.service.createTag(teamId, name, color);
    return new SuccessResponse({ data });
  }

  @Put('/tags/:tagId')
  async updateTag(@Req() req: IRequest, @Param('tagId') tagId: string, @Body() body: UpdateTagDto) {
    const { teamId } = req;
    const { name, color } = body;
    const data = await this.service.updateTag(teamId, tagId, name, color);
    return new SuccessResponse({ data });
  }

  @Delete('/tags/:tagId')
  async deeteTag(@Req() req: IRequest, @Param('tagId') tagId: string) {
    const { teamId } = req;
    const data = await this.service.deleteTag(teamId, tagId);
    return new SuccessResponse({ data });
  }

  @Put('/:assetType/:assetId/tags')
  public async updateAssetTags(@Req() req: IRequest, @Param('assetType') assetType: AssetType, @Param('assetId') assetId: string, @Body() body: AddTagToAssetDto) {
    const { teamId } = req;
    const { tagIds = [] } = body;
    const data = await this.service.updateAssetTags(teamId, assetType, assetId, tagIds);
    return new SuccessResponse({ data });
  }

  @Delete('/:assetType/:assetId/tags')
  public async removeAssetTags(@Req() req: IRequest, @Param('assetType') assetType: AssetType, @Param('assetId') assetId: string, @Body() body: RemoveAssetTags) {
    const { teamId } = req;
    const { tagIds } = body;
    const data = await this.service.removeAssetTags(teamId, assetType, assetId, tagIds);
    return new SuccessResponse({ data });
  }
}
