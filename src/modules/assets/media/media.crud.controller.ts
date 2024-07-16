import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateRichMediaDto } from './dto/req/create-rich-media.dto';
import { MediaFileService } from './media.service';
import { WorkflowAuthGuard } from '@/common/guards/workflow-auth.guard';

@ApiTags('Resources')
@Controller('/media-files')
@UseGuards(WorkflowAuthGuard, CompatibleAuthGuard)
export class MediaFileCrudController {
  constructor(protected readonly service: MediaFileService) {}

  @Get('')
  public async listRichMedias(@Req() request: IRequest, @Query() dto: ListDto) {
    const { teamId } = request;
    const { list, totalCount } = await this.service.listRichMedias(teamId, dto);
    return new SuccessListResponse({
      data: list,
      total: totalCount,
      page: dto.page,
      limit: dto.limit,
    });
  }

  @Post('')
  public async createRichMedia(@Req() request: IRequest, @Body() body: CreateRichMediaDto) {
    const { teamId, userId } = request;
    const data = await this.service.createMedia(teamId, userId, body);
    return new SuccessResponse({ data });
  }

  @Delete(':id')
  public async deleteRichMedia(@Req() request: IRequest, @Param('id') id: string) {
    const { teamId } = request;
    await this.service.deleteMedia(teamId, id);
    return new SuccessResponse({
      data: {
        success: true,
      },
    });
  }

  @Get('md5/:md5')
  async getRichMediaByHash(@Param('md5') md5: string, @Req() request: IRequest) {
    const { teamId } = request;
    const data = await this.service.getMediaByMd5(teamId, md5);
    if (!data) {
      return new NotFoundException('Media not exists');
    }
    return new SuccessResponse({ data });
  }
}
