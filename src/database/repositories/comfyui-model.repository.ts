import { ListDto } from '@/common/dto/list.dto';
import { generateDbId } from '@/common/utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComfyuiModelTypeEntity, CreateComfyuiModelTypeParams, UpdateComfyuiModelTypeParams } from '../entities/assets/model/comfyui-model/comfyui-model-type.entity';
import { ComfyuiModelEntity } from '../entities/assets/model/comfyui-model/comfyui-model.entity';
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
  ) {}

  public async listTypes(teamId: string, dto: ListDto) {
    return await this.modelTypeAssetRepository.listAssets('comfyui-model-type', teamId, dto, {
      withTags: true,
      withTeam: true,
      withUser: true,
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
}
