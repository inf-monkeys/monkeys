import { generateDbId } from '@/common/utils';
import { CreateDesignMetadataDto } from '@/modules/design/dto/create-design-metadata.dto';
import { UpdateDesignMetadataDto } from '@/modules/design/dto/update-design-metadata.dto';
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
  public async createDesignMetadata(projectId: string, createDesignMetadataDto: CreateDesignMetadataDto) {
    const id = generateDbId();
    return this.designMetadataRepository.save({
      ...createDesignMetadataDto,
      id,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
      designProjectId: projectId,
    });
  }

  public async findById(id: string) {
    return await this.designMetadataRepository.findOne({
      where: {
        id,
      },
    });
  }

  public async findAllByProjectId(projectId: string) {
    return await this.designMetadataRepository.find({
      where: {
        designProjectId: projectId,
      },
    });
  }

  public async update(designMetadataId: string, updateDesignMetadataDto: UpdateDesignMetadataDto) {
    return await this.designMetadataRepository.update(designMetadataId, {
      ...updateDesignMetadataDto,
      updatedTimestamp: Date.now(),
    });
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
