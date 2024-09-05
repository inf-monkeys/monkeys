import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
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

  @Put('/channels/:channelId')
  public async updateChannel(@Req() req: IRequest, @Param('channelId') channelId: number, @Body() body: { [x: string]: any }) {
    const { teamId } = req;
    console.log(body);

    const result = await this.oneAPIService.updateChannel(teamId, channelId, body);
    console.log(result);
    return new SuccessResponse({
      data: result,
    });
  }

  @Get('/models')
  public async getModels() {
    const result = await this.oneAPIService.getModels();
    return new SuccessResponse({
      data: result,
    });
  }

  @Post('/channel/test/:channelId')
  public async testChannel(@Req() req: IRequest, @Param('channelId') channelId: number, @Body() body: { modelId: string }) {
    const result = await this.oneAPIService.testChannel(channelId, body.modelId);
    return new SuccessResponse({
      data: result,
    });
  }
}
