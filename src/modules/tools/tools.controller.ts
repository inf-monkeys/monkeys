import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { All, Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RegisterToolDto } from './dto/req/register-tool.dto';
import { ToolsForwardService } from './tools.forward.service';
import { ToolsRegistryService } from './tools.registry.service';

@Controller('tools')
@ApiTags('Tools')
export class ToolsController {
  constructor(
    private readonly toolRegistryService: ToolsRegistryService,
    private readonly toolForwardService: ToolsForwardService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List All tools',
    description: 'List All tools',
  })
  public async listTools() {
    const result = await this.toolRegistryService.listTools();
    return new SuccessResponse({
      data: result,
    });
  }

  @Get(':toolName')
  @ApiOperation({
    summary: 'List All tools',
    description: 'List All tools',
  })
  public async getToolDetail(@Param('toolName') toolName: string) {
    const result = await this.toolRegistryService.getToolByName(toolName);
    return new SuccessResponse({
      data: result,
    });
  }

  @Post('/register')
  @UseGuards(CompatibleAuthGuard)
  public async registerWorker(@Body() body: RegisterToolDto) {
    const { manifestJsonUrl } = body;
    await this.toolRegistryService.registerToolsServer({
      manifestUrl: manifestJsonUrl,
    });
    return new SuccessResponse({
      data: true,
    });
  }

  @All('/:toolNamespace/*')
  @ApiExcludeEndpoint()
  @UseGuards(CompatibleAuthGuard)
  public async forwardToTool(@Req() req: IRequest, @Param('toolNamespace') toolNamespace: string) {
    const result = await this.toolForwardService.forward(toolNamespace, req);
    return result;
  }
}
