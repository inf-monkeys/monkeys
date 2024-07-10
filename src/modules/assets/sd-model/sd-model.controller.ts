import { ListDto } from '@/common/dto/list.dto';
import { SuccessListResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { SdModelService } from './sd-model.service';
import { WorkflowAuthGuard } from '@/common/guards/workflow-auth.guard';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';

@Controller('sd-models')
@UseGuards(WorkflowAuthGuard, CompatibleAuthGuard)
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
