import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { UpdateComfyuiModelParams } from '@/database/entities/assets/model/comfyui-model/comfyui-model.entity';
import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ComfyuiModelService } from './comfyui-model.service';

@Controller('comfyui-models')
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

  @Get('list')
  public async getModelsByTypeAndServerId(@Req() req: IRequest, @Query() query: { typeId?: string; typeName?: string; serverId?: string }) {
    const { teamId } = req;
    const { typeId, serverId, typeName } = query;
    if (!(typeId || typeName) || !serverId) throw new Error('typeId or typeName with serverId are required');
    return new SuccessResponse({
      data: await this.service.getModelsByTypeAndServerId(teamId, serverId, { typeId, typeName }),
    });
  }

  @Post('manual-update')
  public async manualUpdate(@Req() req: IRequest, @Body() body: { serverId: string }) {
    const { teamId } = req;
    const { serverId } = body;
    return new SuccessResponse({
      data: await this.service.updateModelsByTeamIdAndServerId(teamId, serverId),
    });
  }

  @Get(':id')
  public async getModelById(@Req() req: IRequest, @Param('id') modelId: string) {
    const { teamId } = req;
    return new SuccessResponse({
      data: await this.service.getModelById(teamId, modelId),
    });
  }

  @Put(':id')
  public async updateModel(@Req() req: IRequest, @Param('id') modelId: string, @Body() body: UpdateComfyuiModelParams) {
    const { teamId } = req;
    return new SuccessResponse({
      data: await this.service.updateModel(teamId, modelId, body),
    });
  }

  // HACK: 临时业务
  @Post('update-from-internals')
  public async updateFromInternals(@Req() req: IRequest) {
    const { teamId } = req;
    return new SuccessResponse({
      data: await this.service.updateModelsFromInternals(teamId),
    });
  }

  // HACK: 临时业务
  @Post('update-to-internals')
  public async updateToInternals(@Req() req: IRequest) {
    const { teamId } = req;
    return new SuccessResponse({
      data: await this.service.updateModelsToInternals(teamId),
    });
  }
}
