import { ListDto } from '@/common/dto/list.dto';
import { ComfyuiPrompt, ComfyuiWorkflow } from '@/common/typings/comfyui';
import { generateDbId } from '@/common/utils';
import { BlockDefProperties } from '@inf-monkeys/vines';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComfyuiWorkflowEntity, ComfyuiWorkflowSourceType } from '../entities/comfyui/comfyui-workflow.entity';
import { ComfyuiWorkflowAssetRepositroy } from './assets-comfyui-workflow.respository';

export interface CreateComfyuiWorkflowParams {
  workflowType: ComfyuiWorkflowSourceType;
  originalData: { [x: string]: any };
  workflow?: ComfyuiWorkflow;
  prompt: ComfyuiPrompt;
  displayName: string;
  toolInput?: BlockDefProperties[];
}

@Injectable()
export class ComfyuiWorkflowRepository {
  constructor(
    @InjectRepository(ComfyuiWorkflowEntity)
    private readonly comfyuiWorkflowRepository: Repository<ComfyuiWorkflowEntity>,
    private readonly comfyuiWorkflowAssetsRepository: ComfyuiWorkflowAssetRepositroy,
  ) {}

  public async listComfyuiWorkflows(teamId: string, dto: ListDto) {
    return await this.comfyuiWorkflowAssetsRepository.listAssets('comfyui-workflow', teamId, dto, {
      withTags: true,
      withTeam: true,
      withUser: true,
    });
  }

  public async deleteComfyuiWorkflow(id: string) {
    await this.comfyuiWorkflowRepository.update(
      {
        id,
      },
      {
        isDeleted: true,
        updatedTimestamp: +new Date(),
      },
    );
  }

  public async updateComfyuiWorkflowToolInput(id: string, toolInput: BlockDefProperties[]) {
    await this.comfyuiWorkflowRepository.update(
      {
        id,
      },
      {
        updatedTimestamp: +new Date(),
        toolInput,
      },
    );
  }

  public async createComfyuiWorkflow(teamId: string, userId: string, comfyuiWorkflow: CreateComfyuiWorkflowParams) {
    const entity = new ComfyuiWorkflowEntity();
    entity.id = generateDbId();
    entity.createdTimestamp = +new Date();
    entity.updatedTimestamp = +new Date();
    entity.isDeleted = false;
    entity.teamId = teamId;
    entity.creatorUserId = userId;
    entity.workflowType = comfyuiWorkflow.workflowType;
    entity.originalData = comfyuiWorkflow.originalData;
    entity.workflow = comfyuiWorkflow.workflow;
    entity.prompt = comfyuiWorkflow.prompt;
    entity.displayName = comfyuiWorkflow.displayName;
    entity.toolInput = comfyuiWorkflow.toolInput || [];

    await this.comfyuiWorkflowRepository.save(entity);
  }

  public async getComfyuiWorkflowById(id: string) {
    return await this.comfyuiWorkflowRepository.findOne({
      where: {
        id,
        isDeleted: false,
      },
    });
  }

  public async getAllComfyuiWorkflows(teamId: string) {
    return await this.comfyuiWorkflowRepository.find({
      where: {
        isDeleted: false,
        teamId,
      },
    });
  }
}
