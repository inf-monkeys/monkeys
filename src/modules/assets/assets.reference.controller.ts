import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AssetsReferenceService } from './assets.reference.service';
import { ListReferencedWorkflowsDto } from './req/list-referenced-workflows.dto';

@Controller('assets')
@ApiTags('Assets/Reference')
@UseGuards(CompatibleAuthGuard)
export class AssetsReferenceController {
  constructor(private readonly service: AssetsReferenceService) {}

  @Get('/reference/workflow')
  public async getWorkflowReference(@Req() req: IRequest, @Query() query: ListReferencedWorkflowsDto) {
    const data = await this.service.getWorkflowReference(req.teamId, query.assetType, query.assetId);
    return new SuccessResponse({
      data,
    });
  }
}
