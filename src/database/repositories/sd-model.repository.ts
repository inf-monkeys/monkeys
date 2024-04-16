import { ListDto } from '@/common/dto/list.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SdModelEntity } from '../entities/assets/model/sd-model/sd-model';
import { SdModelAssetRepositroy } from './assets-sd-model.repository';

@Injectable()
export class SdModelRepository {
  constructor(
    @InjectRepository(SdModelEntity)
    private readonly llmModelRepository: Repository<SdModelEntity>,
    private readonly sdModelAssetRepositroy: SdModelAssetRepositroy,
  ) {}

  public async listSdModels(teamId: string, dto: ListDto) {
    return await this.sdModelAssetRepositroy.listAssets('sd-model', teamId, dto, {
      withTags: true,
      withTeam: true,
      withUser: true,
    });
  }
}
