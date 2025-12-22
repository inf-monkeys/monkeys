import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ToolEntity } from '@/database/entities/agents/tool.entity';

/**
 * Tool Repository
 *
 * **职责**：
 * - 管理 Agent 工具定义
 * - 提供工具查询接口供 Agent 使用
 * - 支持团队私有工具 + 公开工具查询
 */
@Injectable()
export class ToolRepository {
  constructor(
    @InjectRepository(ToolEntity)
    private readonly repository: Repository<ToolEntity>,
  ) {}

  /**
   * 根据名称查找工具（支持团队私有和公开工具）
   */
  async findByName(name: string, teamId?: string): Promise<ToolEntity | null> {
    // 优先查找团队私有工具
    if (teamId) {
      const privateTool = await this.repository.findOne({
        where: {
          name,
          teamId,
          isDeleted: false,
        },
      });
      if (privateTool) {
        return privateTool;
      }
    }

    // 查找公开工具
    return await this.repository.findOne({
      where: {
        name,
        isPublic: true,
        isDeleted: false,
      },
    });
  }

  /**
   * 根据名称列表批量查找工具
   */
  async findByNames(names: string[], teamId?: string): Promise<ToolEntity[]> {
    const tools: ToolEntity[] = [];

    for (const name of names) {
      const tool = await this.findByName(name, teamId);
      if (tool) {
        tools.push(tool);
      }
    }

    return tools;
  }

  /**
   * 查找团队可用的所有工具（私有 + 公开）
   */
  async findAvailableForTeam(teamId: string): Promise<ToolEntity[]> {
    return await this.repository.find({
      where: [
        // 团队私有工具
        { teamId, isDeleted: false },
        // 公开工具
        { isPublic: true, isDeleted: false },
      ],
      order: { createdTimestamp: 'DESC' },
    });
  }

  /**
   * 查找公开工具
   */
  async findPublicTools(): Promise<ToolEntity[]> {
    return await this.repository.find({
      where: { isPublic: true, isDeleted: false },
      order: { createdTimestamp: 'DESC' },
    });
  }

  /**
   * 根据分类查找工具
   */
  async findByCategory(category: string, teamId?: string): Promise<ToolEntity[]> {
    const where: any = {
      category,
      isDeleted: false,
    };

    if (teamId) {
      return await this.repository.find({
        where: [
          { ...where, teamId },
          { ...where, isPublic: true },
        ],
        order: { createdTimestamp: 'DESC' },
      });
    }

    return await this.repository.find({
      where: { ...where, isPublic: true },
      order: { createdTimestamp: 'DESC' },
    });
  }

  /**
   * 检查工具是否存在
   */
  async exists(name: string, teamId?: string): Promise<boolean> {
    const tool = await this.findByName(name, teamId);
    return tool !== null;
  }
}
