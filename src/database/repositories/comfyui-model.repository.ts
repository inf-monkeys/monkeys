import { ListDto } from '@/common/dto/list.dto';
import { generateDbId } from '@/common/utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ComfyuiModelServerRelationEntity } from '../entities/assets/model/comfyui-model/comfyui-model-server-relation.entity';
import { ComfyuiModelTypeEntity, CreateComfyuiModelTypeParams, UpdateComfyuiModelTypeParams } from '../entities/assets/model/comfyui-model/comfyui-model-type.entity';
import { ComfyuiModelEntity, CreateComfyuiModelParams } from '../entities/assets/model/comfyui-model/comfyui-model.entity';
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
  ) {}

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
    if (!entity) {
      return null;
    }
    if (updates.displayName) {
      entity.displayName = updates.displayName;
    }
    if (updates.description != undefined) {
      entity.description = updates.description;
    }
    if (updates.name) {
      entity.name = updates.name;
    }
    if (updates.path) {
      entity.path = updates.path;
    }
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
    );
    const modelTypes = (
      await this.modelTypeRepository.find({
        where: {
          teamId,
          isDeleted: false,
        },
      })
    ).sort((a, b) => a.path.split('/').length - b.path.split('/').length);

    const list = rawModels.list.map((model) => {
      const { serverRelations } = model;
      return {
        ...model,
        serverRelations: serverRelations
          ? serverRelations.map((relation) => {
              return {
                ...relation,
                type: modelTypes.find((type) => relation.path.toLowerCase().startsWith(type.path.toLowerCase())),
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

  public async getModelsByServerId(teamId: string, serverId: string) {
    const rawModels = await this.modelRepository.find({
      where: {
        teamId,
        serverRelations: {
          server: {
            id: In([serverId]),
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
    const modelTypes = (
      await this.modelTypeRepository.find({
        where: {
          teamId,
          isDeleted: false,
        },
      })
    ).sort((a, b) => a.path.split('/').length - b.path.split('/').length);

    return rawModels.map((model) => {
      const { serverRelations } = model;
      return {
        ...model,
        serverRelations: serverRelations
          ? serverRelations.map((relation) => {
              return {
                ...relation,
                type: modelTypes.find((type) => relation.path.toLowerCase().startsWith(type.path.toLowerCase())),
              };
            })
          : undefined,
      };
    });
  }

  public async getModelById(teamId: string, modelId: string) {
    const rawModel = await this.modelRepository.findOne({
      where: {
        teamId,
        id: modelId,
        isDeleted: false,
      },
      relations: {
        serverRelations: {
          server: true,
        },
      },
    });
    const modelTypes = (
      await this.modelTypeRepository.find({
        where: {
          teamId,
          isDeleted: false,
        },
      })
    ).sort((a, b) => a.path.split('/').length - b.path.split('/').length);

    if (rawModel.serverRelations) {
      rawModel.serverRelations = rawModel.serverRelations.map((relation) => {
        return {
          ...relation,
          type: modelTypes.find((type) => relation.path.toLowerCase().startsWith(type.path.toLowerCase())),
        };
      });
    }

    return rawModel;
  }

  public async getModelsBySha256List(teamId: string, sha256List: string[]) {
    return await this.modelRepository.find({ where: { sha256: In(sha256List), teamId, isDeleted: false } });
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
    return params.map(async (p) => {
      return await this.createModel(teamId, p);
    });
  }

  public async saveModel(model: Pick<ComfyuiModelEntity, 'sha256' | 'id' | 'serverRelations'>) {
    return await this.modelRepository.save(model);
  }

  public async saveModels(models: Pick<ComfyuiModelEntity, 'sha256' | 'id' | 'serverRelations'>[]) {
    return await this.modelRepository.save(models);
  }

  public async saveRelation(relation: ComfyuiModelServerRelationEntity) {
    return await this.relationRepository.save(relation);
  }
}
