import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateMarketplaceAppWithVersionDto } from '../dto/create-app.dto';
import { MarketplaceService } from '../services/marketplace.service';

@ApiTags('Marketplace/Submissions')
@Controller('marketplace/submissions')
@UseGuards(CompatibleAuthGuard)
export class MarketplaceSubmissionController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Post('/')
  @ApiOperation({
    summary: 'Submit a new application or a new version to the marketplace',
    description: 'Creates a new application if it does not exist, and adds a new version with the specified assets.',
  })
  public async submitApp(@Req() req: IRequest, @Body() body: CreateMarketplaceAppWithVersionDto) {
    const { teamId, userId } = req;

    const result = await this.marketplaceService.createAppWithVersion(teamId, userId, body);

    return new SuccessResponse({
      data: result,
      message: 'Application submitted successfully. It is now pending approval.',
    });
  }

  @Get('/my-submissions')
  @ApiOperation({ summary: '获取我的应用提交记录' })
  public async listMySubmissions(@Req() req: IRequest, @Query() listDto: ListDto) {
    const { teamId } = req;
    const { list, total } = await this.marketplaceService.listDeveloperSubmissions(teamId, listDto);
    return new SuccessListResponse({
      data: list,
      total,
      page: listDto.page,
      limit: listDto.limit,
    });
  }

  @Put('/:appId/archive')
  @ApiOperation({ summary: '申请存档我的应用' })
  public async archiveApp(@Req() req: IRequest, @Param('appId') appId: string) {
    const { teamId } = req;
    const app = await this.marketplaceService.archiveApp(teamId, appId);
    return new SuccessResponse({ data: app });
  }

  @Put('/:appId/resubmit')
  @ApiOperation({ summary: '重新提交被拒绝的应用' })
  public async resubmitApp(@Req() req: IRequest, @Param('appId') appId: string, @Body() body: CreateMarketplaceAppWithVersionDto) {
    const { teamId, userId } = req;
    const result = await this.marketplaceService.resubmitRejectedApp(teamId, userId, appId, body);
    return new SuccessResponse({
      data: result,
      message: 'Application resubmitted successfully. It is now pending approval.',
    });
  }
}
