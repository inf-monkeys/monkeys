import { Injectable } from '@nestjs/common';
import { DesignProjectEntity } from '../../database/entities/design/design-project';
import { DesignProjectRepository } from '../../database/repositories/design-project.repository';
@Injectable()
export class DesignProjectService {
  constructor(private readonly designProjectRepository: DesignProjectRepository) {}

  async create(designProject: DesignProjectEntity) {
    return this.designProjectRepository.create(designProject);
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
