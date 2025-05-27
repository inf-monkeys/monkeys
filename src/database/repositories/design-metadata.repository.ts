import { generateDbId } from '@/common/utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DesignMetadataEntity } from '../entities/design/design-metatdata';

@Injectable()
export class DesignMetadataRepository {
  constructor(
    @InjectRepository(DesignMetadataEntity)
    private readonly designMetadataRepository: Repository<DesignMetadataEntity>,
  ) {}

  public async createDesignMetadata(designMetadata: DesignMetadataEntity) {
    const id = generateDbId();
    return this.designMetadataRepository.save({
      ...designMetadata,
      id,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
    });
  }

  public async findByIdAndTeamId(designMetadataId: string, teamId: string) {
    const data = await this.designMetadataRepository.findOne({
      where: {
        id: designMetadataId,
        teamId,
      },
    });
    return data;
  }

  public async updateDesignMetadata(designMetadataId: string, designMetadata: DesignMetadataEntity) {
    return await this.designMetadataRepository.update(designMetadataId, designMetadata);
  }

  public async deleteDesignMetadata(designMetadataId: string) {
    const data = await this.designMetadataRepository.findOne({
      where: {
        id: designMetadataId,
      },
    });
    if (!data) {
      return;
    }
    await this.designMetadataRepository.update(data.id, { isDeleted: true });
  }

  public async findAllbyTeamId(teamId: string) {
    return await this.designMetadataRepository.find({
      where: {
        teamId,
      },
    });
  }

  public async findByProjectId(projectId: string) {
    return await this.designMetadataRepository.findOne({
      where: {
        designProjectId: projectId,
      },
    });
  }
}
