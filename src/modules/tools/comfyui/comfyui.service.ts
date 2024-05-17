import { ListDto } from '@/common/dto/list.dto';
import { readComfyuiWorkflowFromImage } from '@/common/utils/comfyui';
import { ComfyuiWorkflowSourceType } from '@/database/entities/comfyui/comfyui-workflow.entity';
import { ComfyuiWorkflowRepository } from '@/database/repositories/comfyui-workflow.repository';
import { BlockDefProperties } from '@inf-monkeys/vines';
import { Injectable } from '@nestjs/common';

export interface ImportComfyuiWorkflowParams {
  displayName?: string;
  workflowType: ComfyuiWorkflowSourceType;
  imageUrl?: string;
  workflowApiJson?: any;
}

@Injectable()
export class ComfyUIService {
  constructor(private readonly comfyuiWorkflowRepository: ComfyuiWorkflowRepository) {}

  public async listComfyuiWorkflows(teamId: string, dto: ListDto) {
    return await this.comfyuiWorkflowRepository.listComfyuiWorkflows(teamId, dto);
  }

  public async deleteComfyuiWorkflow(id: string) {
    await this.comfyuiWorkflowRepository.deleteComfyuiWorkflow(id);
  }

  public async updateComfyuiWorkflow(id: string, toolInput: BlockDefProperties[]) {
    await this.comfyuiWorkflowRepository.updateComfyuiWorkflow(id, toolInput);
  }

  public async importComfyuiWorkflow(teamId: string, userId: string, params: ImportComfyuiWorkflowParams) {
    const { workflowType, imageUrl, displayName, workflowApiJson } = params;
    if (workflowType === 'image') {
      const { workflow, prompt } = await readComfyuiWorkflowFromImage(imageUrl);
      const comfyuiWorkflow = await this.comfyuiWorkflowRepository.createComfyuiWorkflow(teamId, userId, {
        workflowType,
        originalData: { imageUrl },
        wofkflow: workflow,
        prompt,
        displayName,
      });
      return comfyuiWorkflow;
    }
  }

  public async getComfyuiWorkflowById(id: string) {
    return await this.comfyuiWorkflowRepository.getComfyuiWorkflowById(id);
  }
}
