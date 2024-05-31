import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ComfyUIService, IComfyuiWorkflowDependencyUninstalledNode } from './comfyui.service';

@Controller('/comfyui/dependencies/')
@ApiTags('ComfyUI')
@UseGuards(CompatibleAuthGuard)
export class ComfyuiDependencyController {
  constructor(private readonly comfyuiService: ComfyUIService) {}

  @Post('/')
  public async installComfyuiDependencies(
    @Body()
    body: {
      serverAddress: string;
      dependencies: {
        nodes: IComfyuiWorkflowDependencyUninstalledNode[];
      };
    },
  ) {
    const { serverAddress, dependencies } = body;
    const data = await this.comfyuiService.installComfyuiDependencies(serverAddress, dependencies);
    return new SuccessResponse({
      data,
    });
  }
}
