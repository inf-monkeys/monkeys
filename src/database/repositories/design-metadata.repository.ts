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

  //c
  public async createDesignMetadata(projectId: string, designMetadata: DesignMetadataEntity) {
    const id = generateDbId();
    return this.designMetadataRepository.save({
      ...designMetadata,
      id,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
      designProjectId: projectId,
    });
  }

  public async findById(id: string) {
    const data = await this.designMetadataRepository.findOne({
      where: {
        id,
      },
    });
    return data;
  }

  public async findAllByTeamId(teamId: string) {
    const data = await this.designMetadataRepository.find({
      where: {
        teamId,
      },
    });
    return data;
  }

  public async findAllByProjectId(projectId: string) {
    const data = await this.designMetadataRepository.find({
      where: {
        designProjectId: projectId,
      },
    });
    return data;
  }

  public async update(designMetadataId: string, designMetadata: DesignMetadataEntity) {
    return await this.designMetadataRepository.update(designMetadataId, designMetadata);
  }

  public async deleteById(designMetadataId: string) {
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

  public async deleteAllByProjectId(projectId: string) {
    const data = await this.designMetadataRepository.find({
      where: {
        designProjectId: projectId,
      },
    });

    if (!data) {
      return;
    }

    for (const item of data) {
      await this.designMetadataRepository.update(item.id, { isDeleted: true });
    }
  }
}
