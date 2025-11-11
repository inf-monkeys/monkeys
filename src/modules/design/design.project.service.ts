import { ListDto } from '@/common/dto/list.dto';
import { DesignMetadataRepository } from '@/database/repositories/design-metadata.repository';
import { TeamRepository } from '@/database/repositories/team.repository';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DesignProjectEntity } from '../../database/entities/design/design-project';
import { DesignProjectRepository } from '../../database/repositories/design-project.repository';
import { CreateDesignProjectDto } from './dto/create-design-project.dto';

@Injectable()
export class DesignProjectService {
  constructor(
    private readonly designProjectRepository: DesignProjectRepository,
    private readonly designMetadataRepository: DesignMetadataRepository,
    private readonly teamRepository: TeamRepository,
  ) {}

  async create(createDesignProjectDto: CreateDesignProjectDto & { teamId: string; creatorUserId: string }) {
    const projectEntity = new DesignProjectEntity();

    Object.assign(projectEntity, createDesignProjectDto, {
      assetType: 'design-project',
    });

    const createdProject = await this.designProjectRepository.create(projectEntity);

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
    const { totalCount, list } = await this.designProjectRepository.findAllByTeamId(teamId, dto); // [cite: 1293]
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

  /**
   * 检查用户是否为团队所有者
   */
  async checkIsTeamOwner(teamId: string, userId: string): Promise<boolean> {
    const team = await this.teamRepository.getTeamById(teamId);
    if (!team) {
      return false;
    }
    return team.ownerUserId === userId;
  }

  /**
   * 检查用户是否有权限操作设计模板
   * 只有团队所有者才能操作模板
   */
  async checkTemplatePermission(project: DesignProjectEntity, userId: string): Promise<void> {
    if (project.isTemplate) {
      const isOwner = await this.checkIsTeamOwner(project.teamId, userId);
      if (!isOwner) {
        throw new ForbiddenException('只有团队所有者才能操作设计模板');
      }
    }
  }

  /**
   * Fork 设计模板：复制模板项目及其所有画板到新的设计项目
   */
  async forkTemplate(templateProjectId: string, teamId: string, creatorUserId: string): Promise<DesignProjectEntity> {
    // 获取模板项目
    const templateProject = await this.findById(templateProjectId);
    if (!templateProject) {
      throw new NotFoundException('设计模板不存在');
    }

    if (!templateProject.isTemplate) {
      throw new ForbiddenException('只能 fork 设计模板');
    }

    // 直接创建新的设计项目实体（不调用 create 方法，避免创建默认画板）
    const projectEntity = new DesignProjectEntity();
    Object.assign(projectEntity, {
      displayName: templateProject.displayName,
      description: templateProject.description,
      iconUrl: templateProject.iconUrl,
      sortIndex: templateProject.sortIndex,
      isTemplate: false, // 新项目不是模板
      teamId,
      creatorUserId,
      assetType: 'design-project',
    });

    const newProject = await this.designProjectRepository.create(projectEntity);

    // 获取模板项目的所有画板
    const templateBoards = await this.designMetadataRepository.findAllByProjectId(templateProjectId);

    // 复制所有画板到新项目（包括所有内容和缩略图）
    for (const board of templateBoards) {      
      // 深拷贝 snapshot，确保完全独立
      let snapshotCopy: any = null;
      if (board.snapshot) {
        try {
          // 如果 snapshot 是字符串，先解析；如果是对象，直接深拷贝
          if (typeof board.snapshot === 'string') {
            snapshotCopy = JSON.parse(board.snapshot);
          } else {
            snapshotCopy = JSON.parse(JSON.stringify(board.snapshot));
          }
        } catch (error) {
          snapshotCopy = board.snapshot; // 如果深拷贝失败，使用原始值
        }
      } else {
        // 如果 snapshot 为空，使用空对象而不是 null
        snapshotCopy = {};
      }
      
      const createdBoard = await this.designMetadataRepository.createDesignMetadata(newProject.id, {
        displayName: board.displayName,
        snapshot: snapshotCopy,
        pinned: board.pinned,
        thumbnailUrl: board.thumbnailUrl, // 复制缩略图
        teamId,
        designProjectId: newProject.id,
        createdTimestamp: Date.now(),
        updatedTimestamp: Date.now(),
      });
      
    }

    return newProject;
  }
}
