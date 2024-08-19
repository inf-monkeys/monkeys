import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ComfyuiModelService } from './comfyui-model.service';

@Controller('/comfyui-models')
@UseGuards(CompatibleAuthGuard)
export class ComfyuiModelController {
  constructor(private readonly service: ComfyuiModelService) {}

  @Get()
  public async getModels(@Req() req: IRequest, @Query() dto: ListDto) {
    const { teamId } = req;
    const { list, totalCount } = await this.service.listModels(teamId, dto);
    return new SuccessListResponse({
      data: list,
      total: totalCount,
      page: dto.page,
      limit: dto.limit,
    });
  }

  @Post('/manual-update')
  public async manualUpdate(@Req() req: IRequest, @Body() body: { serverId: string }) {
    const { teamId } = req;
    const { serverId } = body;
    return new SuccessResponse({
      data: await this.service.updateModels(teamId, serverId),
    });
  }
}
