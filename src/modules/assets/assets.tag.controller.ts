import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssetsTagService } from './assets.tag.service';
import { CreateTagDto } from './req/create-tag.dto';
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
  async createTag(@Req() request: IRequest, @Body() body: CreateTagDto) {
    const { teamId } = request;
    const { name, color } = body;
    if (typeof name !== 'string' || !name.trim()) {
      throw new Error('请输入标签名称');
    }
    if (typeof color !== 'string' || !color.trim()) {
      throw new Error('请输入标签颜色');
    }
    const data = await this.service.createTag(teamId, name, color);
    return new SuccessResponse({ data });
  }

  @Put('/tags/:tagId')
  async updateTag(@Req() request: IRequest, @Param('tagId') tagId: string, @Body() body: UpdateTagDto) {
    const { teamId } = request;
    const { name, color } = body;
    const data = await this.service.updateTag(teamId, tagId, name, color);
    return new SuccessResponse({ data });
  }

  @Delete('/tags/:tagId')
  async deeteTag(@Req() request: IRequest, @Param('tagId') tagId: string) {
    const { teamId } = request;
    const data = await this.service.deleteTag(teamId, tagId);
    return new SuccessResponse({ data });
  }
}
