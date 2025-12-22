import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamQuotaEntity } from '@/database/entities/identity/team-quota';
import { generateDbId } from '@/common/utils';

/**
 * TeamQuota Repository
 *
 * **职责**：
 * - 团队配额配置的 CRUD 操作
 * - 配额查询和更新
 * - 使用量统计
 */
@Injectable()
export class TeamQuotaRepository {
  constructor(
    @InjectRepository(TeamQuotaEntity)
    private readonly repository: Repository<TeamQuotaEntity>,
  ) {}

  /**
   * 创建团队配额配置
   */
  async create(data: Partial<TeamQuotaEntity>): Promise<TeamQuotaEntity> {
    const quota = this.repository.create({
      id: generateDbId(),
      ...data,
    });
    return await this.repository.save(quota);
  }

  /**
   * 根据团队 ID 查找配额配置
   */
  async findByTeamId(teamId: string): Promise<TeamQuotaEntity | null> {
    return await this.repository.findOne({
      where: { teamId, isDeleted: false },
    });
  }

  /**
   * 获取或创建团队配额（使用默认值）
   */
  async findOrCreate(teamId: string): Promise<TeamQuotaEntity> {
    let quota = await this.findByTeamId(teamId);

    if (!quota) {
      // 创建默认配额
      quota = await this.create({
        teamId,
        dailyToolCallQuota: 1000,
        maxConcurrentToolCalls: 10,
        enabled: true,
        currentUsage: 0,
        quotaResetAt: this.getNextResetTime(),
      });
    }

    return quota;
  }

  /**
   * 更新团队配额配置
   */
  async update(teamId: string, data: Partial<TeamQuotaEntity>): Promise<TeamQuotaEntity> {
    await this.repository.update({ teamId }, data);
    return await this.findByTeamId(teamId);
  }

  /**
   * 增加使用量
   */
  async incrementUsage(teamId: string, amount: number = 1): Promise<void> {
    await this.repository.increment(
      { teamId },
      'currentUsage',
      amount,
    );
  }

  /**
   * 重置使用量
   */
  async resetUsage(teamId: string): Promise<void> {
    await this.repository.update(
      { teamId },
      {
        currentUsage: 0,
        quotaResetAt: this.getNextResetTime(),
      },
    );
  }

  /**
   * 检查并重置过期的配额
   */
  async resetExpiredQuotas(): Promise<void> {
    const now = new Date();
    const expiredQuotas = await this.repository.find({
      where: {
        isDeleted: false,
      },
    });

    for (const quota of expiredQuotas) {
      if (quota.quotaResetAt && quota.quotaResetAt <= now) {
        await this.resetUsage(quota.teamId);
      }
    }
  }

  /**
   * 获取所有启用的团队配额
   */
  async findAllEnabled(): Promise<TeamQuotaEntity[]> {
    return await this.repository.find({
      where: { enabled: true, isDeleted: false },
    });
  }

  /**
   * 删除团队配额（软删除）
   */
  async delete(teamId: string): Promise<void> {
    await this.repository.update({ teamId }, { isDeleted: true });
  }

  /**
   * 获取下一次重置时间（次日0点 UTC）
   */
  private getNextResetTime(): Date {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow;
  }
}
