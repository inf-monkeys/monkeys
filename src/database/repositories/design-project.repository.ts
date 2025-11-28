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

  public async create(designProject: Omit<DesignProjectEntity, 'id'>, useExistProjectId?: string) {
    const id = generateDbId();
    const projectId = useExistProjectId || generateDbId();
    const projectToSave = {
      ...designProject,
      id,
      projectId,
      version: designProject.version || 1,
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

    // 先获取所有符合条件的项目
    const queryBuilder = this.designProjectRepository
      .createQueryBuilder('dp')
      .where('dp.team_id = :teamId', { teamId })
      .andWhere('dp.is_deleted = false');

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

    // 先获取所有项目，然后在应用层过滤出每个 projectId 的最新版本
    const allProjects = await queryBuilder.getMany();
    
    // 按 projectId 分组，保留每组中 version 最大的
    const projectMap = new Map<string, DesignProjectEntity>();
    for (const project of allProjects) {
      const existing = projectMap.get(project.projectId);
      if (!existing || project.version > existing.version) {
        projectMap.set(project.projectId, project);
      }
    }
    
    // 转换为数组
    let projects = Array.from(projectMap.values());
    
    // 计数
    const totalCount = projects.length;

    // 排序
    const validOrderColumns = {
      createdTimestamp: 'createdTimestamp',
      updatedTimestamp: 'updatedTimestamp',
    };
    const orderField = validOrderColumns[orderColumn] || 'createdTimestamp';
    projects.sort((a, b) => {
      const aVal = a[orderField];
      const bVal = b[orderField];
      if (orderBy.toUpperCase() === 'ASC') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // 分页
    projects = projects.slice((page - 1) * limit, page * limit);

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
    // TypeORM 的 update 只能接受实体上已注册为 Column 的字段
    // 像 assetType 这类仅在代码中使用、未映射为列的属性如果直接传入，会报
    // "Property \"assetType\" was not found in \"DesignProjectEntity\"" 错误
    const { assetType, ...payload } = designProject as any;

    return this.designProjectRepository.update(id, payload);
  }

  public async delete(id: string) {
    await this.designMetadataRepository.deleteAllByProjectId(id);
    await this.designProjectRepository.update(id, { isDeleted: true });
  }

  /**
   * 根据 projectId 和 version 查找设计项目
   */
  public async findByProjectIdAndVersion(projectId: string, version: number) {
    return this.designProjectRepository.findOne({
      where: { projectId, version, isDeleted: false },
    });
  }

  /**
   * 获取设计项目的所有版本
   */
  public async findAllVersionsByProjectId(projectId: string): Promise<DesignProjectEntity[]> {
    return this.designProjectRepository.find({
      where: { projectId, isDeleted: false },
      order: { version: 'DESC' },
    });
  }

  /**
   * 获取设计项目的最新版本号
   */
  public async getLatestVersion(projectId: string): Promise<number> {
    const result = await this.designProjectRepository
      .createQueryBuilder('dp')
      .select('MAX(dp.version)', 'maxVersion')
      .where('dp.project_id = :projectId', { projectId })
      .andWhere('dp.is_deleted = false')
      .getRawOne();
    return result?.maxVersion || 1;
  }

  /**
   * 创建新版本（复制现有版本）
   */
  public async createNewVersion(
    sourceProjectId: string,
    sourceVersion: number,
    newVersion: number,
    updates?: Partial<DesignProjectEntity>,
  ): Promise<DesignProjectEntity> {
    const sourceProject = await this.findByProjectIdAndVersion(sourceProjectId, sourceVersion);
    if (!sourceProject) {
      throw new Error('Source project not found');
    }

    const newId = generateDbId();
    const newProject = {
      ...sourceProject,
      ...updates,
      id: newId,
      projectId: sourceProjectId,
      version: newVersion,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
    };

    delete (newProject as any).firstBoard; // 删除查询时附加的字段

    return this.designProjectRepository.save(newProject);
  }

  /**
   * 删除设计项目的所有版本
   */
  public async deleteAllVersions(projectId: string) {
    const versions = await this.findAllVersionsByProjectId(projectId);
    for (const version of versions) {
      await this.delete(version.id);
    }
  }
}
