import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { DataManagementV2Service } from './data-management-v2.service';
import { QueryDataTagV2Dto } from './dto/data-tag-v2.dto';

@ApiTags('Admin Data Management V2 - Tags')
@Controller('admin/data-v2/tags')
@UseGuards(AdminJwtGuard)
@ApiBearerAuth()
export class DataTagV2Controller {
  constructor(private readonly service: DataManagementV2Service) {}

  @Get()
  @ApiOperation({ summary: '获取标签列表（V2）' })
  @ApiResponse({ status: 200 })
  async listTags(@Query() dto: QueryDataTagV2Dto) {
    return this.service.listTags({
      teamId: dto.teamId,
      keyword: dto.keyword,
      limit: dto.limit,
      pageToken: dto.pageToken,
    });
  }
}
