import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
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

  @Get('/models')
  public async getModels(@Req() req: IRequest) {
    const result = await this.oneAPIService.getModels();
    return new SuccessResponse({
      data: result,
    });
  }

  @Post('/channel/test/:channelId')
  public async testChannel(@Req() req: IRequest, @Param('channelId') channelId: number, @Body() body: { modelId: string; }) {
    const { teamId } = req;
    const result = await this.oneAPIService.testChannel(teamId, channelId, body.modelId);
    return new SuccessResponse({
      data: result,
    });
  }
}
