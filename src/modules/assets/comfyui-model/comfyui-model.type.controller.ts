import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { CreateComfyuiModelTypeParams, GetComfyuiModelTypeQuery, UpdateComfyuiModelTypeParams } from '@/database/entities/assets/model/comfyui-model/comfyui-model-type.entity';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ComfyuiModelService } from './comfyui-model.service';

@Controller('comfyui-models/types')
@UseGuards(CompatibleAuthGuard)
export class ComfyuiModelTypeController {
  constructor(private readonly service: ComfyuiModelService) {}

  @Get()
  public async listTypes(@Req() req: IRequest, @Query() dto: ListDto) {
    const { teamId } = req;
    const { list, totalCount } = await this.service.listTypes(teamId, dto);
    return new SuccessListResponse({
      data: list,
      total: totalCount,
      page: dto.page,
      limit: dto.limit,
    });
  }

  @Post('')
  public async createType(@Req() req: IRequest, @Body() body: CreateComfyuiModelTypeParams) {
    const { teamId, userId } = req;
    return new SuccessResponse({
      data: await this.service.createType(teamId, userId, body),
    });
  }

  @Get('detail')
  public async getTypeByQuery(@Req() req: IRequest, @Query() query: GetComfyuiModelTypeQuery) {
    const { teamId } = req;
    if (!query.name && !query.path) throw new Error('path or name is required');
    return new SuccessResponse({
      data: query.name ? await this.service.getTypeByName(teamId, query.name) : await this.service.getTypeByName(teamId, query.name),
    });
  }

  @Get(':id')
  public async getTypeById(@Req() req: IRequest, @Param('id') typeId: string) {
    const { teamId } = req;
    return new SuccessResponse({
      data: await this.service.getTypeById(teamId, typeId),
    });
  }

  @Put(':id')
  public async updateType(@Req() req: IRequest, @Param('id') typeId: string, @Body() body: UpdateComfyuiModelTypeParams) {
    const { teamId } = req;
    return new SuccessResponse({
      data: await this.service.updateType(teamId, typeId, body),
    });
  }

  @Delete(':id')
  public async deleteType(@Req() req: IRequest, @Param('id') typeId: string) {
    const { teamId } = req;
    await this.service.deleteType(teamId, typeId);
    return new SuccessResponse();
  }
}
