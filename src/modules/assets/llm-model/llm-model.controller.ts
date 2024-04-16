import { ListDto } from '@/common/dto/list.dto';
import { SuccessListResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Controller, Get, Query, Req } from '@nestjs/common';
import { LlmModelService } from './llm-model.service';

@Controller('llm-models')
export class LlmModelController {
  constructor(private readonly service: LlmModelService) {}

  @Get('')
  public async listSqlKnowledgeBases(@Req() req: IRequest, @Query() dto: ListDto) {
    const { teamId } = req;
    const { list, totalCount } = await this.service.listLlmModels(teamId, dto);
    return new SuccessListResponse({
      data: list,
      total: totalCount,
      page: dto.page,
      limit: dto.limit,
    });
  }
}
