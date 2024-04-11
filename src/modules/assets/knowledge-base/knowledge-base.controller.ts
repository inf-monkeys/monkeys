import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { CreateKnowledgeBaseDto } from './dto/req/create-knowledge-base.req.dto';
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

  @Post('')
  public async createKnowledgeBases(@Req() req: IRequest, @Body() body: CreateKnowledgeBaseDto) {
    const { teamId, userId } = req;
    const data = await this.service.createKnowledgeBase(teamId, userId, body);
    return new SuccessResponse({
      data,
    });
  }
}
