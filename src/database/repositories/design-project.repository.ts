import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DesignProjectEntity } from '../entities/design/design-project';

@Injectable()
export class DesignProjectRepository {
  constructor(
    @InjectRepository(DesignProjectEntity)
    private readonly designProjectRepository: Repository<DesignProjectEntity>,
  ) {}

  public async createDesignProject(designProject: DesignProjectEntity) {
    return this.designProjectRepository.save(designProject);
  }

  public async findDesignProjectById(id: string) {
    return this.designProjectRepository.findOne({ where: { id } });
  }
  public async findDesignProjectByTeamId(teamId: string) {
    return this.designProjectRepository.find({ where: { teamId } });
  }

  public async updateDesignProject(id: string, designProject: DesignProjectEntity) {
    return this.designProjectRepository.update(id, designProject);
  }

  public async deleteDesignProject(id: string) {
    return this.designProjectRepository.delete(id);
  }
}
