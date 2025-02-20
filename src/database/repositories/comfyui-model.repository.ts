import { ListDto } from '@/common/dto/list.dto';
import { generateDbId, maskUrl } from '@/common/utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _, { set } from 'lodash';
import { ILike, In, Repository } from 'typeorm';
import { ComfyuiModelServerRelationEntity } from '../entities/assets/model/comfyui-model/comfyui-model-server-relation.entity';
import { ComfyuiModelTypeEntity, CreateComfyuiModelTypeParams, UpdateComfyuiModelTypeParams } from '../entities/assets/model/comfyui-model/comfyui-model-type.entity';
import { ComfyuiModelEntity, CreateComfyuiModelParams, UpdateComfyuiModelParams } from '../entities/assets/model/comfyui-model/comfyui-model.entity';
import { ComfyuiModelTypeAssetRepositroy } from './assets-comfyui-model-type.repositor';
import { ComfyuiModelAssetRepositroy } from './assets-comfyui-model.repository';

@Injectable()
export class ComfyuiModelRepository {
  constructor(
    @InjectRepository(ComfyuiModelEntity)
    private readonly modelRepository: Repository<ComfyuiModelEntity>,
    private readonly modelAssetRepository: ComfyuiModelAssetRepositroy,
    @InjectRepository(ComfyuiModelTypeEntity)
    private readonly modelTypeRepository: Repository<ComfyuiModelTypeEntity>,
    private readonly modelTypeAssetRepository: ComfyuiModelTypeAssetRepositroy,
    @InjectRepository(ComfyuiModelServerRelationEntity)
    private readonly relationRepository: Repository<ComfyuiModelServerRelationEntity>,
  ) { }

  public async listAssetTypes(teamId: string, dto: ListDto) {
    return await this.modelTypeAssetRepository.listAssets('comfyui-model-type', teamId, dto, {
      withTags: true,
      withTeam: true,
      withUser: true,
    });
  }

  public async listTypes(teamId: string) {
    return await this.modelTypeRepository.find({
      where: {
        teamId,
        isDeleted: false,
      },
    });
  }

  public async createType(teamId: string, userId: string, params: CreateComfyuiModelTypeParams) {
    const { path, name } = params;

    if (!path || !name) {
      throw new Error('path and name are required');
    }

    const entity = new ComfyuiModelTypeEntity();
    entity.id = generateDbId();
    entity.displayName = params.displayName || params.name;
    entity.description = params.description || '';
    entity.teamId = teamId;
    entity.creatorUserId = userId;
    entity.createdTimestamp = +new Date();
    entity.updatedTimestamp = +new Date();
    entity.isDeleted = false;
    entity.path = path;
    entity.name = name;
    return await this.modelTypeRepository.save(entity);
  }

  public async getTypeById(teamId: string, id: string) {
    return await this.modelTypeRepository.findOne({
      where: {
        id,
        teamId,
        isDeleted: false,
      },
    });
  }

  public async getTypeByName(teamId: string, name: string) {
    return await this.modelTypeRepository.findOne({
      where: {
        name,
        teamId,
        isDeleted: false,
      },
    });
  }

  public async getTypeByPath(teamId: string, path: string) {
    return await this.modelTypeRepository.findOne({
      where: {
        path,
        teamId,
        isDeleted: false,
      },
    });
  }

  public async updateType(teamId: string, id: string, updates: UpdateComfyuiModelTypeParams) {
    const entity = await this.getTypeById(teamId, id);
    if (!entity) throw new Error('ComfyUI model type not found');

    if (updates.displayName) entity.displayName = updates.displayName;
    if (updates.description) entity.description = updates.description;
    if (updates.name) entity.name = updates.name;
    if (updates.path) entity.path = updates.path;

    entity.updatedTimestamp = Date.now();
    return await this.modelTypeRepository.save(entity);
  }

  public async deleteType(teamId: string, id: string) {
    const entity = await this.getTypeById(teamId, id);
    if (!entity) {
      return;
    }
    entity.isDeleted = true;
    entity.updatedTimestamp = Date.now();
    await this.modelTypeRepository.save(entity);
  }

  public async updateTypesFromTeamIdToTeamId(originTeamId: string, targetTeamId: string) {
    const originTypes = await this.listTypes(originTeamId);
    const targetTypes = await this.listTypes(targetTeamId);

    const originTypeNameList = originTypes.map((t) => t.name);
    const targetTypeNameList = targetTypes.map((t) => t.name);

    // update
    const toUpdate = targetTypes
      .filter((t) => originTypeNameList.includes(t.name))
      .map((t) => {
        const newParams = _.pick(originTypes.find((ot) => ot.name === t.name) ?? {}, ['displayName', 'description', 'path']);
        return {
          ...t,
          ...newParams,
        };
      });
    toUpdate.forEach(async (t) => {
      await this.updateType(targetTeamId, t.id, t);
    });

    // remove
    const toRemove = targetTypes.filter((t) => !originTypeNameList.includes(t.name));
    const toRemoveResult = await this.modelTypeRepository.remove(toRemove);

    // create
    const toCreate = originTypes.filter((t) => !targetTypeNameList.includes(t.name));
    toCreate.forEach(async (t) => {
      await this.createType(targetTeamId, t.creatorUserId, _.pick(t, ['name', 'description', 'displayName', 'path']));
    });

    return {
      remove: toRemoveResult.length,
      update: toUpdate.length,
      create: toCreate.length,
    };
  }

  public async listModels(teamId: string, dto: ListDto) {
    const rawModels = await this.modelAssetRepository.listAssets(
      'comfyui-model',
      teamId,
      dto,
      {
        withTags: true,
        withTeam: true,
        withUser: true,
      },
      {
        relations: {
          serverRelations: {
            server: true,
          },
        },
      },
      {
        serverRelations: {
          server: {
            isDeleted: false,
          },
        },
      },
    );
    const modelTypes = await this.modelTypeRepository.find({
      where: {
        teamId,
        isDeleted: false,
      },
    });

    const list = rawModels.list.map((model) => {
      const { serverRelations } = model;
      return {
        ...model,
        serverRelations: serverRelations
          ? serverRelations.map((relation) => {
            set(relation, 'server.address', maskUrl(relation.server.address));
            return {
              ...relation,
              type: modelTypes.filter((type) => relation.path.toLowerCase().startsWith(type.path.toLowerCase())),
            };
          })
          : undefined,
      };
    });
    return {
      ...rawModels,
      list,
    };
  }

  public async getModelsWithoutType() {
    return await this.modelRepository.find({
      where: {
        isDeleted: false,
      },
      relations: {
        serverRelations: {
          server: true,
        },
      },
    });
  }

  public async getModelsByTeamId(teamId: string) {
    const rawModels = await this.modelRepository.find({
      where:
        teamId === 'internals'
          ? {
            teamId,
            isDeleted: false,
          }
          : {
            teamId,
            isDeleted: false,
            serverRelations: {
              server: {
                isDeleted: false,
              },
            },
          },
      relations: {
        serverRelations: {
          server: true,
        },
      },
    });
    const modelTypes = await this.modelTypeRepository.find({
      where: {
        teamId,
        isDeleted: false,
      },
    });

    const list = rawModels.map((model) => {
      const { serverRelations } = model;
      return {
        ...model,
        serverRelations: serverRelations
          ? serverRelations.map((relation) => {
            return {
              ...relation,
              type: modelTypes.filter((type) => relation.path.toLowerCase().startsWith(type.path.toLowerCase())),
            };
          })
          : undefined,
      };
    });
    return list;
  }

  public async getModelsByServerId(teamId: string, serverId: string) {
    const rawModels = await this.modelRepository.find({
      where: {
        teamId,
        serverRelations: {
          server: {
            id: In([serverId]),
            isDeleted: false,
          },
        },
        isDeleted: false,
      },
      relations: {
        serverRelations: {
          server: true,
        },
      },
    });
    const modelTypes = await this.modelTypeRepository.find({
      where: {
        teamId,
        isDeleted: false,
      },
    });

    return rawModels.map((model) => {
      const { serverRelations } = model;
      return {
        ...model,
        serverRelations: serverRelations
          ? serverRelations.map((relation) => {
            return {
              ...relation,
              type: modelTypes.filter((type) => relation.path.toLowerCase().startsWith(type.path.toLowerCase())),
            };
          })
          : undefined,
      };
    });
  }

  public async getModelsByTypeAndServerId(teamId: string, serverId: string, typeInfo: { typeId?: string; typeName?: string }) {
    const modelType = typeInfo.typeId ? await this.getTypeById(teamId, typeInfo.typeId) : typeInfo.typeName && (await this.getTypeByName(teamId, typeInfo.typeName));
    if (!modelType) throw new Error('Model type not found');

    const rawModels = await this.modelRepository.find({
      where: {
        teamId,
        serverRelations: {
          server: {
            id: In([serverId]),
            isDeleted: false,
          },
          path: ILike(`${modelType.path}%`),
        },
        isDeleted: false,
      },
      relations: {
        serverRelations: {
          server: true,
        },
      },
    });

    const modelTypes = await this.modelTypeRepository.find({
      where: {
        teamId,
        isDeleted: false,
      },
    });

    return rawModels.map((model) => {
      const { serverRelations } = model;
      return {
        ...model,
        serverRelations: serverRelations
          ? serverRelations.map((relation) => {
            const pathArr = relation.path.split('/');
            set(relation, 'server.address', maskUrl(relation.server.address));
            return {
              ...relation,
              apiPath: pathArr.length > 1 ? pathArr.slice(1).join('/') : relation.path,
              type: modelTypes.filter((type) => relation.path.toLowerCase().startsWith(type.path.toLowerCase())),
            };
          })
          : undefined,
      };
    });
  }

  public async getModelsBySha256List(teamId: string, sha256List: string[]) {
    return await this.modelRepository.find({ where: { sha256: In(sha256List), teamId, isDeleted: false } });
  }

  public async getModelById(teamId: string, modelId: string) {
    const rawModel = await this.modelRepository.findOne({
      where: [
        {
          teamId,
          id: modelId,
          isDeleted: false,
          serverRelations: {
            server: {
              isDeleted: false,
            },
          },
        },
        {
          teamId,
          id: modelId,
          isDeleted: false,
          serverRelations: null,
        },
      ],
      relations: {
        serverRelations: {
          server: true,
        },
      },
    });

    if (!rawModel) throw new Error('ComfyUI model not found');

    const modelTypes = await this.modelTypeRepository.find({
      where: {
        teamId,
        isDeleted: false,
      },
    });

    if (rawModel.serverRelations) {
      rawModel.serverRelations = rawModel.serverRelations.map((relation) => {
        set(relation, 'server.address', maskUrl(relation.server.address));
        return {
          ...relation,
          type: modelTypes.filter((type) => relation.path.toLowerCase().startsWith(type.path.toLowerCase())),
        };
      });
    }

    return rawModel;
  }

  public async createModel(teamId: string, params: CreateComfyuiModelParams) {
    const { sha256 } = params;

    if (!sha256) throw new Error('path and sha256 are required');

    const entity = new ComfyuiModelEntity();
    entity.id = params.id || generateDbId();
    entity.displayName = params.displayName || '';
    entity.description = params.description || '';
    entity.teamId = teamId;
    entity.createdTimestamp = +new Date();
    entity.updatedTimestamp = +new Date();
    entity.isDeleted = false;
    entity.sha256 = sha256;
    entity.serverRelations = params.serverRelations || [];
    return await this.modelRepository.save(entity);
  }

  public async createModels(teamId: string, params: CreateComfyuiModelParams[]) {
    const r: ComfyuiModelEntity[] = [];
    for (const p of params) {
      r.push(await this.createModel(teamId, p));
    }
    return r;
  }

  public async saveModel(model: Pick<ComfyuiModelEntity, 'sha256' | 'id' | 'serverRelations'>) {
    return await this.modelRepository.save(model);
  }

  public async saveModels(models: Pick<ComfyuiModelEntity, 'sha256' | 'id' | 'serverRelations'>[]) {
    return await this.modelRepository.save(models);
  }

  public async updateModel(teamId: string, modelId: string, updates: UpdateComfyuiModelParams) {
    const entity = await this.getModelById(teamId, modelId);
    if (!entity) throw new Error('ComfyUI model not found');

    if (updates.displayName) entity.displayName = updates.displayName;
    if (updates.description) entity.description = updates.description;
    if (updates.iconUrl) entity.iconUrl = updates.iconUrl;

    entity.updatedTimestamp = Date.now();
    return await this.modelRepository.save(entity);
  }

  public async saveRelation(relation: ComfyuiModelServerRelationEntity) {
    return await this.relationRepository.save(relation);
  }

  public async updateModelsFromTeamIdToTeamId(originTeamId: string, targetTeamId: string) {
    // 并行获取源数据和目标数据
    const [originModels, targetModels] = await Promise.all([this.getModelsByTeamId(originTeamId), this.getModelsByTeamId(targetTeamId)]);

    // 使用 Set 提高查找效率
    const originSha256Set = new Set(originModels.map((m) => m.sha256));
    const targetSha256Set = new Set(targetModels.map((m) => m.sha256));

    console.log(originTeamId, originModels.length, targetTeamId, targetModels.length);

    // 需要更新的目标模型（SHA256 匹配的）
    const toUpdate = targetModels
      .filter((m) => originSha256Set.has(m.sha256))
      .map((m) => ({
        id: m.id,
        ..._.pick(originModels.find((om) => om.sha256 === m.sha256)!, ['displayName', 'description', 'iconUrl']),
      }));

    // 需要创建的新模型（存在于源但不在目标中的）
    const toCreate = originTeamId === 'internals' ? [] : originModels.filter((m) => !targetSha256Set.has(m.sha256));

    // 执行更新操作
    for (const model of toUpdate) {
      await this.updateModel(targetTeamId, model.id, model);
    }

    // 执行创建操作
    for (const model of toCreate) {
      await this.createModel(targetTeamId, _.pick(model, ['iconUrl', 'description', 'displayName', 'sha256']));
    }

    return {
      remove: 0, // 根据要求不执行删除操作
      update: toUpdate.length,
      create: toCreate.length,
    };
  }
}
