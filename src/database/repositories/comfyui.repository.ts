import { ListDto } from '@/common/dto/list.dto';
import { ComfyuiPrompt, ComfyuiWorkflow } from '@/common/typings/comfyui';
import { generateDbId } from '@/common/utils';
import { CreateComfyuiServerDto } from '@/modules/tools/comfyui/dto/req/create-comfyui-server';
import { ToolProperty } from '@inf-monkeys/monkeys';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { IsNull, Repository } from 'typeorm';
import { ComfyuiServerEntity, ComfyuiServerStatus } from '../entities/comfyui/comfyui-server.entity';
import { ComfyuiWorkflowEntity, ComfyuiWorkflowSourceType } from '../entities/comfyui/comfyui-workflow.entity';
import { ComfyuiWorkflowAssetRepositroy } from './assets-comfyui-workflow.respository';

export interface CreateComfyuiWorkflowParams {
  workflowType: ComfyuiWorkflowSourceType;
  originalData: { [x: string]: any };
  workflow?: ComfyuiWorkflow;
  prompt: ComfyuiPrompt;
  displayName: string;
  toolInput?: ToolProperty[];
  toolOutput?: ToolProperty[];
}

@Injectable()
export class ComfyuiRepository {
  constructor(
    @InjectRepository(ComfyuiWorkflowEntity)
    private readonly comfyuiWorkflowRepository: Repository<ComfyuiWorkflowEntity>,
    @InjectRepository(ComfyuiServerEntity)
    private readonly comfyuiServerRepository: Repository<ComfyuiServerEntity>,
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

  public async updateComfyuiWorkflow(
    id: string,
    updates: {
      toolInput?: ToolProperty[];
      toolOutput?: ToolProperty[];
      workflow?: ComfyuiWorkflow;
      workflowApi?: ComfyuiPrompt;
    },
  ) {
    await this.comfyuiWorkflowRepository.update(
      {
        id,
      },
      _.omitBy(
        {
          toolInput: updates.toolInput,
          toolOutput: updates.toolOutput,
          workflow: updates.workflow,
          prompt: updates.workflowApi,
          updatedTimestamp: +new Date(),
        },
        _.isNil,
      ),
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
    entity.toolOutput = comfyuiWorkflow.toolOutput || [];

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

  public async listServers(teamId: string) {
    return await this.comfyuiServerRepository.find({
      where: [
        {
          isDeleted: false,
          teamId: IsNull(),
        },
        {
          isDeleted: false,
          teamId,
        },
      ],
    });
  }

  public async listAllServers() {
    return await this.comfyuiServerRepository.find({
      where: {
        isDeleted: false,
      },
    });
  }

  public async createDefaultServer(address: string) {
    const exists = await this.comfyuiServerRepository.findOne({
      where: {
        isDefault: true,
        isDeleted: false,
      },
    });
    if (!exists) {
      const entity = new ComfyuiServerEntity();
      entity.id = 'default';
      entity.createdTimestamp = +new Date();
      entity.updatedTimestamp = +new Date();
      entity.isDeleted = false;
      entity.address = address;
      entity.status = ComfyuiServerStatus.Unkonwn;
      entity.description = '默认 ComfyUI Server';
      entity.isDefault = true;
      await this.comfyuiServerRepository.save(entity);
    } else {
      exists.address = address;
      await this.comfyuiServerRepository.save(exists);
    }
  }

  public async createComfyuiServer(teamId: string, userId: string, data: CreateComfyuiServerDto) {
    const entity = new ComfyuiServerEntity();
    entity.id = generateDbId();
    entity.createdTimestamp = +new Date();
    entity.updatedTimestamp = +new Date();
    entity.isDeleted = false;
    entity.teamId = teamId;
    entity.creatorUserId = userId;
    entity.address = data.address;
    entity.status = ComfyuiServerStatus.Unkonwn;
    entity.description = data.description;
    entity.isDefault = false;
    await this.comfyuiServerRepository.save(entity);
  }

  public async deleteComfyuiServer(teamId: string, address: string) {
    await this.comfyuiServerRepository.update(
      {
        teamId,
        address,
      },
      {
        isDeleted: true,
        updatedTimestamp: +new Date(),
      },
    );
  }

  public async getComfyuiServerById(teamId: string | null, serverId: string) {
    return await this.comfyuiServerRepository.findOne({
      where: {
        teamId,
        id: serverId,
      },
    });
  }
}
