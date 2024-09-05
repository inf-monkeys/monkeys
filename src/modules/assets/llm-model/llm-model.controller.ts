import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { WorkflowAuthGuard } from '@/common/guards/workflow-auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { UpdateLlmModelParams } from '@/database/entities/assets/model/llm-model/llm-model';
import { Body, Controller, Delete, Get, Param, Put, Query, Req, UseGuards } from '@nestjs/common';
import { LlmModelService } from './llm-model.service';

@Controller('llm-models')
@UseGuards(WorkflowAuthGuard, CompatibleAuthGuard)
export class LlmModelController {
  constructor(private readonly service: LlmModelService) {}

  @Get('')
  public async listLlmModels(@Req() req: IRequest, @Query() dto: ListDto) {
    const { teamId } = req;
    const list = await this.service.listLlmModels(teamId, dto);
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
