import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { CreateKnowledgeBaseDto } from './dto/req/create-knowledge-base.req.dto';
import { UpdateKnowledgeBaseDto } from './dto/req/update-knowledge-base.req.dto';
import { KnowledgeBaseService } from './knowledge-base.service';

@Controller('knowledge-bases')
@UseGuards(CompatibleAuthGuard)
export class KnowledgeBaseController {
  constructor(private readonly service: KnowledgeBaseService) {}

  @Get('')
  public async listKnowledgeBases(@Req() req: IRequest, @Query() dto: ListDto) {
    const { teamId } = req;
    const { list, totalCount } = await this.service.listKnowledgeBases(teamId, dto);
    return new SuccessListResponse({
      data: list,
      total: totalCount,
      page: dto.page,
      limit: dto.limit,
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

  @Get(':knowledgeBaseId')
  public async getKnowledgeBase(@Req() req: IRequest, @Param('knowledgeBaseId') knowledgeBaseId: string) {
    const { teamId } = req;
    const data = await this.service.getKnowledgeBaseByName(teamId, knowledgeBaseId);
    return new SuccessResponse({
      data,
    });
  }

  @Put(':knowledgeBaseId')
  public async updateKnowledgeBase(@Req() req: IRequest, @Param('knowledgeBaseId') knowledgeBaseId: string, @Body() body: UpdateKnowledgeBaseDto) {
    const { teamId } = req;
    const data = await this.service.updateKnowledgeBase(teamId, knowledgeBaseId, {
      displayName: body.displayName,
      description: body.description,
      iconUrl: body.iconUrl,
    });
    return new SuccessResponse({
      data,
    });
  }

  @Delete(':knowledgeBaseId')
  public async deleteKnowledgeBase(@Req() req: IRequest, @Param('knowledgeBaseId') knowledgeBaseId: string) {
    const { teamId } = req;
    await this.service.deleteKnowledgeBase(teamId, knowledgeBaseId);
    return new SuccessResponse();
  }
}
