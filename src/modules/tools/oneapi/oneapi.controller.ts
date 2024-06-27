import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { OneAPIService } from './oneapi.service';

@Controller('/oneapi')
@UseGuards(CompatibleAuthGuard)
export class OneAPIController {
  constructor(private readonly oneAPIService: OneAPIService) {}

  @Post('/channels/:channelId')
  public async createOneAPIChannel(@Req() req: IRequest, @Param('channelId') channelId: number, @Body() body: { [x: string]: any }) {
    const { teamId, userId } = req;
    const result = await this.oneAPIService.createOneAPIChannel(teamId, userId, channelId, body);
    return new SuccessResponse({
      data: result,
    });
  }
}
