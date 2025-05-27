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
    return await this.designMetadataRepository.createDesignMetadata({
      ...createDesignMetadataDto,
      id,
      teamId: createDesignMetadataDto.teamId,
    });
  }

  async findAllbyTeamId(teamId: string) {
    return await this.designMetadataRepository.findAllbyTeamId(teamId);
  }

  async findByProjectId(projectId: string) {
    return await this.designMetadataRepository.findByProjectId(projectId);
  }

  async update(id: string, updateDesignMetadataDto: UpdateDesignMetadataDto) {
    const designMetadata = await this.designMetadataRepository.findByIdAndTeamId(id, updateDesignMetadataDto.teamId);
    if (!designMetadata) {
      throw new NotFoundException('设计画板不存在');
    }
    return await this.designMetadataRepository.updateDesignMetadata(id, {
      ...designMetadata,
      ...updateDesignMetadataDto,
      id,
      teamId: updateDesignMetadataDto.teamId,
    });
  }

  async remove(id: string) {
    return this.designMetadataRepository.deleteDesignMetadata(id);
  }
}
