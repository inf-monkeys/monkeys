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

  /**
   * 导出设计项目：获取项目及其所有画板的完整数据
   */
  async exportProject(projectId: string, userId: string) {
    const project = await this.findById(projectId);
    if (!project) {
      throw new NotFoundException('设计项目不存在');
    }

    // 如果是模板，检查权限：只有团队所有者才能导出模板
    if (project.isTemplate) {
      await this.checkTemplatePermission(project, userId);
    }
    // 普通设计项目允许所有人导出

    // 获取所有画板（包括snapshot）
    const boards = await this.designMetadataRepository.findAllByProjectId(projectId);

    // 构建导出数据
    return {
      version: '1.0',
      exportTime: Date.now(),
      project: {
        displayName: project.displayName,
        description: project.description,
        iconUrl: project.iconUrl,
        isTemplate: project.isTemplate,
      },
      boards: boards.map((board) => ({
        displayName: board.displayName,
        snapshot: board.snapshot,
        pinned: board.pinned,
        thumbnailUrl: board.thumbnailUrl,
      })),
    };
  }

  /**
   * 导入设计项目：从JSON数据创建新的设计项目
   */
  async importProject(
    importData: {
      version?: string;
      project: {
        displayName: string | Record<string, string>;
        description?: string | Record<string, string>;
        iconUrl?: string;
        isTemplate?: boolean;
      };
      boards: Array<{
        displayName: string | Record<string, string>;
        snapshot: any;
        pinned?: boolean;
        thumbnailUrl?: string;
      }>;
    },
    teamId: string,
    creatorUserId: string,
  ): Promise<DesignProjectEntity> {
    // 如果导入的是模板，检查权限：只有团队所有者才能导入模板
    if (importData.project.isTemplate) {
      const isOwner = await this.checkIsTeamOwner(teamId, creatorUserId);
      if (!isOwner) {
        throw new ForbiddenException('只有团队所有者才能导入设计模板');
      }
    }
    // 普通设计项目允许所有人导入

    // 创建新的设计项目
    const projectEntity = new DesignProjectEntity();
    Object.assign(projectEntity, {
      displayName: importData.project.displayName,
      description: importData.project.description,
      iconUrl: importData.project.iconUrl,
      isTemplate: importData.project.isTemplate ?? false,
      teamId,
      creatorUserId,
      assetType: 'design-project',
    });

    const newProject = await this.designProjectRepository.create(projectEntity);

    // 导入所有画板
    for (const boardData of importData.boards) {
      // 深拷贝 snapshot
      let snapshotCopy: any = null;
      if (boardData.snapshot) {
        try {
          if (typeof boardData.snapshot === 'string') {
            snapshotCopy = JSON.parse(boardData.snapshot);
          } else {
            snapshotCopy = JSON.parse(JSON.stringify(boardData.snapshot));
          }
        } catch (error) {
          snapshotCopy = boardData.snapshot;
        }
      } else {
        snapshotCopy = {};
      }

      // 处理 displayName：如果是对象，转换为字符串；如果是字符串，直接使用
      const displayNameStr =
        typeof boardData.displayName === 'string'
          ? boardData.displayName
          : JSON.stringify(boardData.displayName);

      await this.designMetadataRepository.createDesignMetadata(newProject.id, {
        displayName: displayNameStr,
        snapshot: snapshotCopy,
        pinned: boardData.pinned ?? false,
        thumbnailUrl: boardData.thumbnailUrl,
        teamId,
        designProjectId: newProject.id,
        createdTimestamp: Date.now(),
        updatedTimestamp: Date.now(),
      });
    }

    return newProject;
  }
}
