import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Delete, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ComfyUIService } from './comfyui.service';
import { CreateComfyuiServerDto } from './dto/req/create-comfyui-server';

@Controller('comfyui/servers/')
@ApiTags('ComfyUI')
@UseGuards(CompatibleAuthGuard)
export class ComfyuiServerController {
  constructor(private readonly comfyuiService: ComfyUIService) {}

  @Get('/')
  public async listComfyuiServers(@Req() req: IRequest) {
    const { teamId } = req;
    const data = await this.comfyuiService.listServers(teamId);

    const builtInServer = data.find((server) => server.isDefault);
    if (builtInServer) {
      builtInServer.address = 'system';
    }

    return new SuccessResponse({
      data,
    });
  }

  @Post('/')
  public async createComfyuiServer(@Req() req: IRequest, @Body() body: CreateComfyuiServerDto) {
    const { teamId, userId } = req;
    const data = await this.comfyuiService.createComfyuiServer(teamId, userId, body);
    return new SuccessResponse({
      data,
    });
  }

  @Delete('/')
  public async deleteComfyuiServer(@Req() req: IRequest, @Body('address') address: string) {
    const { teamId } = req;
    const data = await this.comfyuiService.deleteComfyuiServer(teamId, address);
    return new SuccessResponse({
      data,
    });
  }

  @Post('/test')
  public async testComfyuiServer(@Body('address') address: string) {
    const data = await this.comfyuiService.getBuiltInOrCustomServer(address);
    return new SuccessResponse({
      data,
    });
  }
}
