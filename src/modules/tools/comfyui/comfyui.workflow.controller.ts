import { ListDto } from '@/common/dto/list.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessListResponse, SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { BlockDefProperties } from '@inf-monkeys/vines';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ComfyUIService, ImportComfyuiWorkflowParams } from './comfyui.service';

@Controller('comfyui/workflows/')
@ApiTags('ComfyUI')
@UseGuards(CompatibleAuthGuard)
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
      toolInput: BlockDefProperties[];
    },
  ) {
    const data = await this.comfyuiService.updateComfyuiWorkflowToolInput(id, body.toolInput);
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
