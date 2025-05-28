import { ListDto } from '@/common/dto/list.dto';
import { generateDbId } from '@/common/utils';
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

  public async create(designProject: Omit<DesignProjectEntity, 'id'>) {
    const id = generateDbId();
    const projectToSave = {
      ...designProject,
      id,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
    };
    return this.designProjectRepository.save(projectToSave);
  }

  public async findById(id: string) {
    return this.designProjectRepository.findOne({ where: { id, isDeleted: false } });
  }

  public async findAllByTeamId(
    teamId: string,
    dto: ListDto,
  ): Promise<{
    totalCount: number;
    list: DesignProjectEntity[];
  }> {
    const { page = 1, limit = 24, orderBy = 'DESC', orderColumn = 'createdTimestamp', filter } = dto;

    const queryBuilder = this.designProjectRepository.createQueryBuilder('dp').where('dp.team_id = :teamId', { teamId }).andWhere('dp.is_deleted = false');

    // Apply filtering if provided
    if (filter) {
      // Add filter logic here if needed
      if (filter.userIds && filter.userIds.length > 0) {
        queryBuilder.andWhere('dp.creator_user_id IN (:...userIds)', { userIds: filter.userIds });
      }
      if (filter.createdTimestamp && filter.createdTimestamp.length === 2) {
        const [start, end] = filter.createdTimestamp;
        if (start) queryBuilder.andWhere('dp.created_timestamp >= :start', { start });
        if (end) queryBuilder.andWhere('dp.created_timestamp <= :end', { end });
      }
    }

    // Count total number of projects
    const totalCount = await queryBuilder.getCount();

    // Apply ordering
    const validOrderColumns = {
      createdTimestamp: 'dp.created_timestamp',
      updatedTimestamp: 'dp.updated_timestamp',
    };
    const orderColumnSql = validOrderColumns[orderColumn] || 'dp.created_timestamp';

    // Apply pagination
    const projects = await queryBuilder
      .orderBy(orderColumnSql, orderBy.toUpperCase() === 'ASC' ? 'ASC' : 'DESC')
      .limit(limit)
      .offset((page - 1) * limit)
      .getMany();

    return {
      totalCount,
      list: projects,
    };
  }

  public async update(id: string, designProject: DesignProjectEntity) {
    return this.designProjectRepository.update(id, designProject);
  }

  public async delete(id: string) {
    await this.designMetadataRepository.deleteAllByProjectId(id);
    await this.designProjectRepository.update(id, { isDeleted: true });
  }
}
