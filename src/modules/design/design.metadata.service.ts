import { generateDbId } from '@/common/utils';
import { DesignMetadataRepository } from '@/database/repositories/design-metadata.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDesignMetadataDto } from './dto/create-design-metadata.dto';
import { UpdateDesignMetadataDto } from './dto/update-design-metadata.dto';

@Injectable()
export class DesignMetadataService {
  constructor(private readonly designMetadataRepository: DesignMetadataRepository) {}
  async create(createDesignMetadataDto: CreateDesignMetadataDto) {
    const id = generateDbId();
    return await this.designMetadataRepository.createDesignMetadata(createDesignMetadataDto.designProjectId, {
      ...createDesignMetadataDto,
      id,
      teamId: createDesignMetadataDto.teamId,
    });
  }

  async findById(id: string) {
    return await this.designMetadataRepository.findById(id);
  }

  async findAllbyTeamId(teamId: string) {
    return await this.designMetadataRepository.findAllByTeamId(teamId);
  }

  async findAllByProjectId(projectId: string) {
    return await this.designMetadataRepository.findAllByProjectId(projectId);
  }

  async update(id: string, updateDesignMetadataDto: UpdateDesignMetadataDto) {
    const designMetadata = await this.designMetadataRepository.findById(id);
    if (!designMetadata) {
      throw new NotFoundException('设计画板不存在');
    }
    return await this.designMetadataRepository.update(id, {
      ...designMetadata,
      ...updateDesignMetadataDto,
      id,
      teamId: updateDesignMetadataDto.teamId,
    });
  }

  async remove(id: string) {
    return this.designMetadataRepository.deleteById(id);
  }
}
