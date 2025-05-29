import { ListDto } from '@/common/dto/list.dto';
import { DesignMetadataRepository } from '@/database/repositories/design-metadata.repository';
import { Injectable } from '@nestjs/common';
import { DesignProjectEntity } from '../../database/entities/design/design-project';
import { DesignProjectRepository } from '../../database/repositories/design-project.repository';
import { CreateDesignProjectDto } from './dto/create-design-project.dto';

@Injectable()
export class DesignProjectService {
  constructor(
    private readonly designProjectRepository: DesignProjectRepository,
    private readonly designMetadataRepository: DesignMetadataRepository,
  ) {}

  async create(createDesignProjectDto: CreateDesignProjectDto & { teamId: string; creatorUserId: string }) {
    const projectData = {
      ...createDesignProjectDto,
      assetType: 'design-project',
    } as Omit<DesignProjectEntity, 'id'>;

    const createdProject = await this.designProjectRepository.create(projectData);

    // Create a default design metadata for the new project
    await this.designMetadataRepository.createDesignMetadata(createdProject.id, {
      displayName: '画板',
      snapshot: {},
      pinned: false,
      teamId: createDesignProjectDto.teamId,
      designProjectId: createdProject.id,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
    });

    return createdProject;
  }

  async findById(id: string) {
    return this.designProjectRepository.findById(id);
  }

  async findByTeamId(teamId: string, dto: ListDto) {
    const { totalCount, list } = await this.designProjectRepository.findAllByTeamId(teamId, dto);
    return {
      totalCount,
      list,
    };
  }

  async update(id: string, designProject: DesignProjectEntity) {
    return this.designProjectRepository.update(id, designProject);
  }

  async delete(id: string) {
    return this.designProjectRepository.delete(id);
  }
}
