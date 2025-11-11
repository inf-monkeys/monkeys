import { ListDto } from '@/common/dto/list.dto';
import { generateDbId } from '@/common/utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DesignMetadataEntity } from '../entities/design/design-metatdata';
import { DesignProjectEntity } from '../entities/design/design-project';
import { DesignMetadataRepository } from './design-metadata.repository';

@Injectable()
export class DesignProjectRepository {
  constructor(
    @InjectRepository(DesignProjectEntity)
    private readonly designProjectRepository: Repository<DesignProjectEntity>,
    @InjectRepository(DesignMetadataEntity)
    private readonly designMetadataEntityRepository: Repository<DesignMetadataEntity>,
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
    const { page = 1, limit = 24, orderBy = 'DESC', orderColumn = 'createdTimestamp', filter, search } = dto;
    const searchText = typeof search === 'string' ? search.trim() : '';

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
      if (filter.isTemplate !== undefined) {
        queryBuilder.andWhere('dp.is_template = :isTemplate', { isTemplate: filter.isTemplate });
      }
    }

    if (searchText) {
      queryBuilder.andWhere('(dp.display_name ILIKE :search OR dp.description ILIKE :search)', {
        search: `%${searchText}%`,
      });
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

    // 🚀 性能优化：批量获取每个项目的第一个画板元数据，避免 N+1 查询
    if (projects.length > 0) {
      const projectIds = projects.map((p) => p.id);
      
      // 使用子查询获取每个项目的第一个画板（按创建时间排序）
      const firstBoards = await this.designMetadataEntityRepository
        .createQueryBuilder('dm')
        .select([
          'dm.id',
          'dm.displayName',
          'dm.thumbnailUrl',
          'dm.designProjectId',
          'dm.updatedTimestamp',
          'dm.createdTimestamp',
        ])
        .where('dm.design_project_id IN (:...projectIds)', { projectIds })
        .andWhere('dm.is_deleted = false')
        .orderBy('dm.created_timestamp', 'ASC')
        .getMany();

      // 构建映射：projectId -> 第一个画板
      const firstBoardMap = new Map();
      for (const board of firstBoards) {
        if (!firstBoardMap.has(board.designProjectId)) {
          firstBoardMap.set(board.designProjectId, board);
        }
      }

      // 将第一个画板的信息附加到项目上
      projects.forEach((project: any) => {
        const firstBoard = firstBoardMap.get(project.id);
        project.firstBoard = firstBoard || null;
      });
    }

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
