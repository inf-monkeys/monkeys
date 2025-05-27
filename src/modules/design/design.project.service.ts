import { Injectable } from '@nestjs/common';
import { DesignProjectEntity } from '../../database/entities/design/design-project';
import { DesignProjectRepository } from '../../database/repositories/design-project.repository';
@Injectable()
export class DesignProjectService {
  constructor(private readonly designProjectRepository: DesignProjectRepository) {}

  async createDesignProject(designProject: DesignProjectEntity) {
    return this.designProjectRepository.createDesignProject(designProject);
  }

  async findDesignProjectById(id: string) {
    return this.designProjectRepository.findDesignProjectById(id);
  }

  async findDesignProjectByTeamId(teamId: string) {
    return this.designProjectRepository.findDesignProjectByTeamId(teamId);
  }

  async updateDesignProject(id: string, designProject: DesignProjectEntity) {
    return this.designProjectRepository.updateDesignProject(id, designProject);
  }

  async deleteDesignProject(id: string) {
    return this.designProjectRepository.deleteDesignProject(id);
  }
}
