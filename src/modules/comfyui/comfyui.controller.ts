import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ComfyuiService } from './comfyui.service';
import { CheckComfyUIWorkflowDependenciesDto } from './dto/req/check-comfyui-dependencies.dto';
import { ImportFromComfyUIDto } from './dto/req/import-from-comfyui.dto';
import { RegisterComfyuiServerDto } from './dto/req/register-comfyui-server.req.dto';
import { UpdateComfyUIInputDto } from './dto/req/update-comfyui-input.dto';
import { UpdateComfyUIWorkflowDto } from './dto/req/update-comfyui-workflow.dto';

@Controller('/comfyui')
export class ComfyuiController {
  constructor(private readonly service: ComfyuiService) {}

  @Post('/servers')
  public async registerComfyuiServer(@Req() req: IRequest, @Body() dto: RegisterComfyuiServerDto) {
    const { teamId } = req;
    const { displayName, baseUrl } = dto;
    const data = await this.service.registerServer(teamId, displayName, baseUrl);
    return new SuccessResponse({
      data,
    });
  }

  @Get('/servers')
  public async listComfyuiServers(@Req() req: IRequest) {
    const { teamId } = req;
    const data = await this.service.listServers(teamId);
    return new SuccessResponse({
      data,
    });
  }

  @Get('/helpers/all-models')
  public async getComfyuiModels(@Query('server') serverName: string) {
    return new SuccessResponse({
      data: await this.service.loadAllModels(serverName),
    });
  }

  @Post('/helpers/generate-tool')
  @ApiOperation({
    summary: '将 Comfyui 工作流导入为 block',
    description: '将 Comfyui 工作流导入为 block',
  })
  public async generateToolByComfyuiWorkflow(@Req() req: IRequest, @Body() body: ImportFromComfyUIDto) {
    const { teamId, userId } = req;
    const { serverName } = body;
    const result = await this.service.generateToolByComfyuiWorkflow(teamId, userId, serverName, body);

    return new SuccessResponse({
      data: result,
    });
  }

  @Post('/helpers/reupload-workflow')
  public async reuploadComfyuiWorkflow(@Req() req: IRequest, @Body() body: UpdateComfyUIWorkflowDto) {
    const result = await this.service.reuploadComfyuiWorkflow(body.blockName, body.serverName, body);
    return new SuccessResponse({
      data: result,
    });
  }

  @Post('/helpers/refresh-tool-input')
  public async refreshToolInput(@Req() req: IRequest, @Body() body: UpdateComfyUIInputDto) {
    const result = await this.service.refreshToolInput(body.blockName, body.serverName);
    return new SuccessResponse({
      data: result,
    });
  }

  @Post('/helpers/check-dependencies')
  @ApiOperation({
    summary: '检测 comfyui workflow 的依赖：第三方模型和第三方 node',
    description: '检测 comfyui workflow 的依赖：第三方模型和第三方 node',
  })
  public async checkComfyuiWorkflowDependencies(@Req() req: IRequest, @Body() body: CheckComfyUIWorkflowDependenciesDto) {
    const data = await this.service.checkComfyuiWorkflowDependencies(body.serverName, {
      prompt: body.prompt,
      workflow: body.workflow,
    });
    return new SuccessResponse({
      data,
    });
  }
}
