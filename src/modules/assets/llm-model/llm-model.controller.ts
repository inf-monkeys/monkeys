import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { LlmModelEntity } from '@/database/entities/assets/model/llm-model/llm-model';
import { getModels } from '@/modules/tools/llm/llm.service';
import { Controller, Delete, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { LlmModelService } from './llm-model.service';

@Controller('llm-models')
@UseGuards(CompatibleAuthGuard)
export class LlmModelController {
  constructor(private readonly service: LlmModelService) {}

  @Get('')
  public async listLlmModels(@Req() req: IRequest, @Query() dto: ListDto) {
    const { teamId } = req;
    let { list } = await this.service.listLlmModels(teamId, dto);
    const systemModels = getModels();

    if (systemModels.length) {
      const systemModesValue = {};
      for (const model of systemModels) {
        systemModesValue[model.value] = model.value;
      }
      const systemChannel = {
        id: '0',
        assetType: 'llm-model',
        channelId: 0,
        channelType: 1,
        displayName: '系统内置',
        models: systemModesValue,
        iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/2560px-OpenAI_Logo.svg.png',
      } as LlmModelEntity;
      list = [systemChannel, ...list];
    }

    return new SuccessListResponse({
      data: list,
      total: list.length,
      page: dto.page,
      limit: dto.limit,
    });
  }

  @Get('/:id')
  public async getLLMModel(@Req() req: IRequest, @Param('id') id: string) {
    const { teamId } = req;
    const model = await this.service.getLLMModel(teamId, id);
    return new SuccessResponse({
      data: model,
    });
  }

  @Delete('/:id')
  public async deleteLLMModel(@Req() req: IRequest, @Param('id') id: string) {
    const { teamId } = req;
    await this.service.deleteLLMModel(teamId, id);
    return new SuccessResponse({
      data: {
        success: true,
      },
    });
  }
}
