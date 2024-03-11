import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { All, Body, Controller, Param, Post, Req } from '@nestjs/common';
import { RegisterWorkerDto } from './dto/req/register-worker.dto';
import { ToolsForwardService } from './tools.forward.service';
import { ToolsRegistryService } from './tools.registry.service';

@Controller('tools')
export class ToolsController {
  constructor(
    private readonly toolRegistryService: ToolsRegistryService,
    private readonly toolForwardService: ToolsForwardService,
  ) {}

  @Post('/register')
  public async registerWorker(@Body() body: RegisterWorkerDto) {
    const { manifestJsonUrl } = body;
    return await this.toolRegistryService.registerToolsServer({
      manifestJsonUrl,
    });
  }

  @All('/:toolName/*')
  public async forwardToTool(@Req() req: IRequest, @Param('toolName') toolName: string) {
    const result = await this.toolForwardService.forward(toolName, req);
    return new SuccessResponse({
      data: result,
    });
  }
}
