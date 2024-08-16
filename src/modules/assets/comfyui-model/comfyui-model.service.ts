import { ListDto } from '@/common/dto/list.dto';
import { CreateComfyuiModelTypeParams, UpdateComfyuiModelTypeParams } from '@/database/entities/assets/model/comfyui-model/comfyui-model-type.entity';
import { ComfyuiModelRepository } from '@/database/repositories/comfyui-model.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ComfyuiModelService {
  constructor(private readonly repository: ComfyuiModelRepository) {}

  public async listTypes(teamId: string, dto: ListDto) {
    return await this.repository.listTypes(teamId, dto);
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
}
