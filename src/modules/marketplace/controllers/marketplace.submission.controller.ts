import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
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
}
