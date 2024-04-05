import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { KnowledgeBaseService } from './knowledge-base.service';

@Controller('knowledge-bases')
@UseGuards(CompatibleAuthGuard)
export class KnowledgeBaseController {
  constructor(private readonly service: KnowledgeBaseService) {}

  @Get('')
  public async listKnowledgeBases(@Req() req: IRequest) {
    const { teamId } = req;
    const data = await this.service.listKnowledgeBases(teamId);
    return new SuccessResponse({
      data,
    });
  }
}
