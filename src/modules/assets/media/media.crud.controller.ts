import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Get, NotFoundException, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateRichMediaDto } from './dto/req/create-rich-media.dto';
import { MediaService } from './media.service';

@ApiTags('Resources')
@Controller('/medias')
@UseGuards(CompatibleAuthGuard)
export class ResourceCrudController {
  constructor(protected readonly service: MediaService) {}

  @Get('')
  public async listRichMedias(@Req() request: IRequest) {}

  @Post('')
  public async createRichMedia(@Req() request: IRequest, @Body() body: CreateRichMediaDto) {
    const { teamId, userId } = request;
    const data = await this.service.createMedia(teamId, userId, body);
    return new SuccessResponse({ data });
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
