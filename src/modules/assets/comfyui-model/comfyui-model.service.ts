import { config } from '@/common/config';
import { ListDto } from '@/common/dto/list.dto';
import { generateDbId } from '@/common/utils';
import { ComfyuiModelServerRelationEntity } from '@/database/entities/assets/model/comfyui-model/comfyui-model-server-relation.entity';
import { CreateComfyuiModelTypeParams, UpdateComfyuiModelTypeParams } from '@/database/entities/assets/model/comfyui-model/comfyui-model-type.entity';
import { UpdateComfyuiModelParams } from '@/database/entities/assets/model/comfyui-model/comfyui-model.entity';
import { ComfyuiModelRepository } from '@/database/repositories/comfyui-model.repository';
import { ComfyUIService } from '@/modules/tools/comfyui/comfyui.service';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { basename } from 'path';

@Injectable()
export class ComfyuiModelService {
  constructor(
    private readonly repository: ComfyuiModelRepository,
    private readonly comfyuiService: ComfyUIService,
  ) {}

  public async listTypes(teamId: string, dto: ListDto) {
    return await this.repository.listAssetTypes(teamId, dto);
  }

  public async getTypeById(teamId: string, id: string) {
    return await this.repository.getTypeById(teamId, id);
  }

  public async getTypeByName(teamId: string, name: string) {
    return await this.repository.getTypeByName(teamId, name);
  }

  public async getTypeByPath(teamId: string, path: string) {
    return await this.repository.getTypeByPath(teamId, path);
  }

  public async createType(teamId: string, creatorUserId: string, body: CreateComfyuiModelTypeParams) {
    return await this.repository.createType(teamId, creatorUserId, body);
  }

  public async updateType(teamId: string, id: string, updates: UpdateComfyuiModelTypeParams) {
    return await this.repository.updateType(teamId, id, updates);
  }

  public async deleteType(teamId: string, id: string) {
    await this.repository.deleteType(teamId, id);
  }

  public async updateTypesFromInternals(teamId: string) {
    return await this.repository.updateTypesFromTeamIdToTeamId('internals', teamId);
  }

  public async updateTypesToInternals(teamId: string) {
    return await this.repository.updateTypesFromTeamIdToTeamId(teamId, 'internals');
  }

  public async listModels(teamId: string, dto: ListDto) {
    return await this.repository.listModels(teamId, dto);
  }

  public async getModelsWithoutType() {
    return await this.repository.getModelsWithoutType();
  }

  public async getModelsByServerId(teamId: string, serverId: string) {
    return await this.repository.getModelsByServerId(teamId, serverId);
  }

  public async getModelsByTypeAndServerId(teamId: string, serverId: string, typeInfo: { typeId?: string; typeName?: string }) {
    return await this.repository.getModelsByTypeAndServerId(teamId, serverId, typeInfo);
  }

  public async getModelsFromServer(serverAddress: string) {
    const { data } = await axios<{ path: string; sha256: string }[]>({
      method: 'GET',
      url: '/comfyfile/model-list',
      baseURL: await this.comfyuiService.getBuiltInOrCustomServer(serverAddress),
      timeout: 5000,
      headers: {
        ...(config?.comfyui?.apiToken && { Authorization: `Bearer ${config.comfyui.apiToken}` }),
      },
    });
    return data;
  }

  public async updateModelsByTeamIdAndServerId(teamId: string, serverId: string) {
    const server = await this.comfyuiService.getComfyuiServerById(serverId === 'default' ? null : teamId, serverId);
    if (!server) throw new Error('ComfyUI server not found');

    const { success, errMsg } = await this.comfyuiService.testComfyuiServerConnection(server.address);
    if (!success)
      throw new Error(
        `Failed to connect to ComfyUI server: ${errMsg}, have you installed the Comfyfile plugin (https://github.com/inf-monkeys/Comfyfile)? And make sure comfyui is listening on 0.0.0.0`,
      );

    const ts = +new Date();

    // 从服务器获取的 model
    const rawModelList = await this.getModelsFromServer(server.address);
    const rawModelRecords = rawModelList.reduce<Record<string, string[]>>((acc, model) => {
      if (!acc[model.sha256]) {
        acc[model.sha256] = [];
      }
      acc[model.sha256].push(model.path);
      return acc;
    }, {});
    // const rawModelSha256List = rawModelList.map((model) => model.sha256);

    // 数据库中原有的 model
    const originModelList = await this.getModelsByServerId(teamId, serverId);
    const originModelSha256List = originModelList.map((model) => model.sha256);

    // 需要删除的 model
    const toRemove = originModelList.filter((model) => !Object.keys(rawModelRecords).includes(model.sha256));
    // const toRemove = originModelList.filter((model) => !rawModelSha256List.includes(model.sha256));

    // 需要添加的 model
    const toAdd = Object.keys(rawModelRecords).filter((sha256) => !originModelSha256List.includes(sha256));

    // 更新需要删除的
    toRemove.forEach((model) => {
      model.serverRelations = model.serverRelations.filter(({ server }) => server.id !== serverId);
      model.updatedTimestamp = ts;
    });
    const toRemoveUpdateResult = await this.repository.saveModels(toRemove);

    // 更新需要添加的
    const toUpdate = await this.repository.getModelsBySha256List(teamId, toAdd);
    toUpdate.forEach(async (model) => {
      const paths = rawModelRecords[model.sha256];
      for (let i = 0; i < paths.length; i++) {
        const path = paths[i];
        const relationEntity = new ComfyuiModelServerRelationEntity();
        relationEntity.id = generateDbId();
        relationEntity.server = server;
        relationEntity.model = model;
        const filename = basename(path);
        relationEntity.path = path;
        relationEntity.filename = filename;
        relationEntity.teamId = teamId;
        model.updatedTimestamp = ts;
        // model.servers ? model.servers.push(relationEntity) : (model.servers = [relationEntity]);
        await this.repository.saveRelation(relationEntity);
      }
    });
    const toUpdateUpdateResult = await this.repository.saveModels(toUpdate);

    // 更新需要新增的
    const toCreate = toAdd
      .filter((sha256) => !toUpdate.some((model) => model.sha256 === sha256))
      .map((sha256) => {
        return {
          sha256,
          id: generateDbId(),
          displayName: basename(rawModelRecords[sha256][0]),
          // servers: [relationEntity],
        };
      });
    const toCreateUpdateResult = await this.repository.createModels(teamId, toCreate);
    toCreateUpdateResult.forEach(async (model) => {
      const paths = rawModelRecords[model.sha256];
      for (let i = 0; i < paths.length; i++) {
        const path = paths[i];
        const relationEntity = new ComfyuiModelServerRelationEntity();
        relationEntity.id = generateDbId();
        relationEntity.server = server;
        relationEntity.model = model;
        const filename = basename(path);
        relationEntity.path = path;
        relationEntity.filename = filename;
        relationEntity.teamId = teamId;
        await this.repository.saveRelation(relationEntity);
      }
    });

    return {
      remove: toRemoveUpdateResult.length,
      update: toUpdateUpdateResult.length,
      create: toCreateUpdateResult.length,
    };
  }

  public async getModelById(teamId: string, modelId: string) {
    return await this.repository.getModelById(teamId, modelId);
  }

  public async updateModel(teamId: string, modelId: string, updates: UpdateComfyuiModelParams) {
    return await this.repository.updateModel(teamId, modelId, updates);
  }

  public async updateModelsFromInternals(teamId: string) {
    return await this.repository.updateModelsFromTeamIdToTeamId('internals', teamId);
  }

  public async updateModelsToInternals(teamId: string) {
    return await this.repository.updateModelsFromTeamIdToTeamId(teamId, 'internals');
  }

  public async isDefaultServerCanConnect() {
    const server = await this.comfyuiService.getComfyuiServerById(null, 'default');
    if (!server) return false;
    const { success } = await this.comfyuiService.testComfyuiServerConnection(server.address);
    return success;
  }
}
