import { generateDbId } from '@/common/utils';
import { AssetType } from '@inf-monkeys/monkeys';
import { Injectable } from '@nestjs/common';
import { DesignProjectEntity } from '../../database/entities/design/design-project';
import { DesignProjectRepository } from '../../database/repositories/design-project.repository';
import { CreateDesignProjectDto } from './dto/create-design-project.dto';

@Injectable()
export class DesignProjectService {
  constructor(private readonly designProjectRepository: DesignProjectRepository) {}

  async create(createDesignProjectDto: CreateDesignProjectDto) {
    const id = generateDbId();
    const project = new DesignProjectEntity();
    Object.assign(project, {
      ...createDesignProjectDto,
      id,
      isDeleted: false,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      assetType: 'design-project' as AssetType,
    });
    return this.designProjectRepository.create(project);
  }

  async findById(id: string) {
    return this.designProjectRepository.findById(id);
  }

  async findByTeamId(teamId: string) {
    return this.designProjectRepository.findAllByTeamId(teamId);
  }

  async update(id: string, designProject: DesignProjectEntity) {
    return this.designProjectRepository.update(id, designProject);
  }

  async delete(id: string) {
    return this.designProjectRepository.delete(id);
  }
}
