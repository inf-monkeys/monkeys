import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { CreateSqlKnowledgeBaseParams } from '@/database/entities/assets/knowledge-base/knowledge-base-sql.entity';
import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SqlKnowledgeBaseService } from './sql-knowledge-base.service';
import { WorkflowAuthGuard } from '@/common/guards/workflow-auth.guard';

@Controller('sql-knowledge-bases')
@UseGuards(WorkflowAuthGuard, CompatibleAuthGuard)
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

  @Get('/:uuid')
  public async getSqlKnowledgeBaseByUUID(@Req() req: IRequest, @Param('uuid') uuid: string) {
    const { teamId } = req;
    const data = await this.service.getSqlKnowledgeBaseByUUID(teamId, uuid);
    return new SuccessResponse({
      data: data,
    });
  }

  @Post()
  public async createSqlKnowledgeBase(@Req() req: IRequest, @Body() body: CreateSqlKnowledgeBaseParams) {
    const { teamId, userId } = req;
    return this.service.createSqlKnowledgeBase(teamId, userId, body);
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
