import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { Controller, UseGuards } from '@nestjs/common';
import { ComfyuiModelService } from './comfyui-model.service';

@Controller('/comfyui-models')
@UseGuards(CompatibleAuthGuard)
export class ComfyuiModelController {
  constructor(private readonly service: ComfyuiModelService) {}
}
