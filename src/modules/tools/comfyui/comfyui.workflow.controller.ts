import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { ComfyuiPrompt, ComfyuiWorkflow } from '@/common/typings/comfyui';
import { IRequest } from '@/common/typings/request';
import { ToolProperty } from '@inf-monkeys/monkeys';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ComfyUIService, ImportComfyuiWorkflowParams } from './comfyui.service';
import { WorkflowAuthGuard } from '@/common/guards/workflow-auth.guard';

@Controller('comfyui/workflows/')
@ApiTags('ComfyUI')
@UseGuards(WorkflowAuthGuard, CompatibleAuthGuard)
export class ComfyuiWorkflowController {
  constructor(private readonly comfyuiService: ComfyUIService) {}

  @Get('/')
  public async listComfyuiWorkflows(@Req() req: IRequest, @Query() dto: ListDto) {
    const { teamId } = req;
    const { list, totalCount } = await this.comfyuiService.listComfyuiWorkflows(teamId, dto);
    return new SuccessListResponse({
      data: list,
      total: totalCount,
      page: dto.page,
      limit: dto.limit,
    });
  }

  @Get('/:id')
  public async getComfyuiWorkflowDetail(@Req() req: IRequest, @Param('id') id: string) {
    const data = await this.comfyuiService.getComfyuiWorkflowById(id);
    return new SuccessResponse({
      data,
    });
  }

  @Get('/:id/dependencies')
  public async checkComfyuiDependencies(@Req() req: IRequest, @Param('id') id: string, @Query('serverAddress') serverAddress: string) {
    const data = await this.comfyuiService.checkComfyuiDependencies(id, serverAddress);
    return new SuccessResponse({
      data,
    });
  }

  @Delete('/:id')
  public async deleteComfyuiWorkflow(@Req() req: IRequest, @Param('id') id: string) {
    const data = await this.comfyuiService.deleteComfyuiWorkflow(id);
    return new SuccessResponse({
      data,
    });
  }

  @Put('/:id')
  public async updateComfyuiWorkflow(
    @Req() req: IRequest,
    @Param('id') id: string,
    @Body()
    body: {
      toolInput: ToolProperty[];
      toolOutput: ToolProperty[];
      workflow: ComfyuiWorkflow;
      workflowApi: ComfyuiPrompt;
    },
  ) {
    const data = await this.comfyuiService.updateComfyuiWorkflow(id, body);
    return new SuccessResponse({
      data,
    });
  }

  @Post('/:id/install')
  public async installComfyfile(@Req() req: IRequest, @Param('id') id: string, @Body('serverAddress') serverAddress: string) {
    const data = await this.comfyuiService.installComfyfile(serverAddress, id);
    return new SuccessResponse({
      data,
    });
  }

  @Post('/:id/gene-input')
  public async autoGenerateToolInput(@Req() req: IRequest, @Param('id') id: string) {
    const data = await this.comfyuiService.autoGenerateToolInput(id);
    return new SuccessResponse({
      data,
    });
  }

  @Post('/')
  public async importComfyuiWorkflow(@Req() req: IRequest, @Body() body: ImportComfyuiWorkflowParams) {
    const { teamId, userId } = req;
    const data = await this.comfyuiService.importComfyuiWorkflow(teamId, userId, body);
    return new SuccessResponse({
      data,
    });
  }
}
