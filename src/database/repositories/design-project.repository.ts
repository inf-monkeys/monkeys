import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DesignProjectEntity } from '../entities/design/design-project';
import { DesignMetadataRepository } from './design-metadata.repository';
@Injectable()
export class DesignProjectRepository {
  constructor(
    @InjectRepository(DesignProjectEntity)
    private readonly designProjectRepository: Repository<DesignProjectEntity>,
    private readonly designMetadataRepository: DesignMetadataRepository,
  ) {}

  public async create(designProject: DesignProjectEntity) {
    return this.designProjectRepository.save(designProject);
  }

  public async findById(id: string) {
    return this.designProjectRepository.findOne({ where: { id } });
  }
  public async findAllByTeamId(teamId: string) {
    return this.designProjectRepository.find({ where: { teamId } });
  }

  public async update(id: string, designProject: DesignProjectEntity) {
    return this.designProjectRepository.update(id, designProject);
  }

  public async delete(id: string) {
    await this.designMetadataRepository.deleteAllByProjectId(id);
    await this.designProjectRepository.update(id, { isDeleted: true });
  }
}
