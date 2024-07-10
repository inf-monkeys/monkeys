import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { All, Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RegisterToolDto } from './dto/req/register-tool.dto';
import { ToolsForwardService } from './tools.forward.service';
import { ToolsRegistryService } from './tools.registry.service';
import { WorkflowAuthGuard } from '@/common/guards/workflow-auth.guard';

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
  @UseGuards(WorkflowAuthGuard, CompatibleAuthGuard)
  public async listTools(@Req() req: IRequest) {
    const { teamId } = req;
    const result = await this.toolRegistryService.listTools(teamId);
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
  public async registerWorker(@Body() body: RegisterToolDto, @Req() req: IRequest) {
    const { userId, teamId } = req;
    await this.toolRegistryService.registerToolsServer(body, {
      userId,
      teamId,
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
