import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessListResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CreateSqlKnowledgeBaseDto } from './dto/req/create-sql-knowledge-base.req.dto';
import { SqlKnowledgeBaseService } from './knowledge-base-sql.service';

@Controller('sql-knowledge-bases')
@UseGuards(CompatibleAuthGuard)
export class SqlKnowledgeBaseController {
  constructor(private readonly service: SqlKnowledgeBaseService) {}

  @Get('')
  public async listSqlKnowledgeBases(@Req() req: IRequest, @Query() dto: ListDto) {
    const { teamId } = req;
    const { list, totalCount } = await this.service.listSqlKnowledgeBases(teamId, dto);
    return new SuccessListResponse({
      data: list,
      total: totalCount,
      page: dto.page,
      limit: dto.limit,
    });
  }

  @Post()
  public async createSqlKnowledgeBase(@Req() req: IRequest, @Body() body: CreateSqlKnowledgeBaseDto) {
    const { teamId, userId } = req;
    return this.service.createSqlKnowledgeBase(teamId, userId, {
      displayName: body.displayName,
      description: body.description,
      iconUrl: body.iconUrl,
    });
  }

  @Delete('/:uuid')
  public async deleteSqlKnowledgeBase(@Req() req: IRequest, @Param('uuid') uuid: string) {
    const { teamId } = req;
    await this.service.deleteSqlKnowledgeBase(teamId, uuid);
    return {
      success: true,
    };
  }
}
