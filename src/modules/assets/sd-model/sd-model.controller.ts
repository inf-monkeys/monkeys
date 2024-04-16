import { ListDto } from '@/common/dto/list.dto';
import { SuccessListResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Controller, Get, Query, Req } from '@nestjs/common';
import { SdModelService } from './sd-model.service';

@Controller('sd-models')
export class SdModelController {
  constructor(private readonly service: SdModelService) {}

  @Get('')
  public async listSqlKnowledgeBases(@Req() req: IRequest, @Query() dto: ListDto) {
    const { teamId } = req;
    const { list, totalCount } = await this.service.listSdModels(teamId, dto);
    return new SuccessListResponse({
      data: list,
      total: totalCount,
      page: dto.page,
      limit: dto.limit,
    });
  }
}
