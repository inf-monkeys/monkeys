import { ListDto } from '@/common/dto/list.dto';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateMarketplaceAppDto } from '../dto/update-app.dto';
import { MarketplaceService } from '../services/marketplace.service';

@ApiTags('Marketplace Admin')
@Controller('marketplace/admin')
export class MarketplaceAdminController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('/submissions')
  @ApiOperation({ summary: 'List pending submissions' })
  async listSubmissions(@Query() listDto: ListDto) {
    const { list, total } = await this.marketplaceService.listSubmissions(listDto);
    return new SuccessListResponse({
      data: list,
      total,
      page: listDto.page,
      limit: listDto.limit,
    });
  }

  @Put('/submissions/:appId')
  @ApiOperation({ summary: 'Update the application information pending review' })
  async updateSubmission(@Param('appId') appId: string, @Body() body: UpdateMarketplaceAppDto) {
    const app = await this.marketplaceService.updateSubmission(appId, body);
    return new SuccessResponse({ data: app });
  }

  @Put('/submissions/:appId/approve')
  @ApiOperation({ summary: 'Approve a submission' })
  async approveSubmission(@Param('appId') appId: string) {
    const app = await this.marketplaceService.approveSubmission(appId);
    return new SuccessResponse({ data: app });
  }

  @Put('/submissions/:appId/reject')
  @ApiOperation({ summary: 'Reject a submission' })
  async rejectSubmission(@Param('appId') appId: string) {
    const app = await this.marketplaceService.rejectSubmission(appId);
    return new SuccessResponse({ data: app });
  }
}
