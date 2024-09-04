import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { WorkflowAuthGuard } from '@/common/guards/workflow-auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { LlmModelEntity, UpdateLlmModelParams } from '@/database/entities/assets/model/llm-model/llm-model';
import { getModels } from '@/modules/tools/llm/llm.service';
import { Body, Controller, Delete, Get, Param, Put, Query, Req, UseGuards } from '@nestjs/common';
import { LlmModelService } from './llm-model.service';

@Controller('llm-models')
@UseGuards(WorkflowAuthGuard, CompatibleAuthGuard)
export class LlmModelController {
  constructor(private readonly service: LlmModelService) {}

  @Get('')
  public async listLlmModels(@Req() req: IRequest, @Query() dto: ListDto) {
    const { teamId } = req;
    let { list } = await this.service.listLlmModels(teamId, dto);
    const systemModels = getModels();

    if (systemModels.length) {
      const systemChannels = [] as LlmModelEntity[];

      for (const { name, value, icon, desc } of systemModels) {
        systemChannels.push({
          assetType: 'llm-model',
          channelId: 0,
          channelType: 1,
          displayName: name,
          description: desc || {
            'zh-CN': '系统内置大语言模型，由 OpenAI 标准接口提供',
            'en-US': 'The system has a built-in large language model, provided by the OpenAI standard interface'
          },
          iconUrl: icon || 'https://monkeyminio01.daocloud.cn/monkeys/icons/openai.webp',
          models: { [value]: value },
          id: `0-${value}`
        } as LlmModelEntity)
      }

      list = [...list, ...systemChannels];
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

  @Put('/:id')
  public async updateLLMModel(@Req() req: IRequest, @Param('id') id: string, @Body() dto: UpdateLlmModelParams) {
    const { teamId } = req;
    await this.service.updateLLMModel(teamId, id, dto);
    return new SuccessResponse({
      data: {
        success: true,
      },
    });
  }
}
