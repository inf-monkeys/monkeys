import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ToolCallEntity } from '@/database/entities/agents/tool-call.entity';
import { generateDbId } from '@/common/utils';

/**
 * ToolCall Repository
 *
 * **职责**：
 * - 工具调用记录的 CRUD 操作
 * - 审批状态查询
 * - 工具调用历史查询
 */
@Injectable()
export class ToolCallRepository {
  constructor(
    @InjectRepository(ToolCallEntity)
    private readonly repository: Repository<ToolCallEntity>,
  ) {}

  /**
   * 创建工具调用记录
   */
  async create(data: Partial<ToolCallEntity>): Promise<ToolCallEntity> {
    const toolCall = this.repository.create({
      id: generateDbId(),
      ...data,
    });
    return await this.repository.save(toolCall);
  }

  /**
   * 根据 ID 查找工具调用
   */
  async findById(id: string): Promise<ToolCallEntity | null> {
    return await this.repository.findOne({
      where: { id, isDeleted: false },
    });
  }

  /**
   * 根据 toolCallId 查找（幂等键）
   */
  async findByToolCallId(toolCallId: string): Promise<ToolCallEntity | null> {
    return await this.repository.findOne({
      where: { toolCallId, isDeleted: false },
    });
  }

  /**
   * 查找线程的所有工具调用
   */
  async findByThreadId(threadId: string, teamId?: string): Promise<ToolCallEntity[]> {
    const where: any = { threadId, isDeleted: false };
    if (teamId) {
      where.teamId = teamId;
    }
    return await this.repository.find({
      where,
      order: { createdTimestamp: 'DESC' },
    });
  }

  /**
   * 查找待审批的工具调用
   */
  async findPendingApprovals(threadId: string, teamId?: string): Promise<ToolCallEntity[]> {
    const where: any = {
      threadId,
      approvalStatus: 'pending',
      isDeleted: false,
    };
    if (teamId) {
      where.teamId = teamId;
    }
    return await this.repository.find({
      where,
      order: { createdTimestamp: 'ASC' },
    });
  }

  /**
   * 更新工具调用
   */
  async update(id: string, data: Partial<ToolCallEntity>): Promise<ToolCallEntity> {
    await this.repository.update({ id }, data);
    return await this.findById(id);
  }

  /**
   * 更新审批状态
   */
  async updateApprovalStatus(
    id: string,
    status: 'approved' | 'rejected',
    userId: string,
  ): Promise<ToolCallEntity> {
    await this.repository.update(
      { id },
      {
        approvalStatus: status,
        approvedBy: userId,
        approvedAt: new Date(),
      },
    );
    return await this.findById(id);
  }

  /**
   * 按团队统计工具调用数量
   */
  async countByTeamId(
    teamId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const query = this.repository.createQueryBuilder('toolCall')
      .where('toolCall.teamId = :teamId', { teamId })
      .andWhere('toolCall.isDeleted = :isDeleted', { isDeleted: false });

    if (startDate) {
      query.andWhere('toolCall.createdTimestamp >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('toolCall.createdTimestamp <= :endDate', { endDate });
    }

    return await query.getCount();
  }

  /**
   * 获取团队的工具调用统计
   */
  async getUsageStats(
    teamId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalCalls: number;
    successCount: number;
    failureCount: number;
    averageDuration: number;
    byTool: Record<string, { calls: number; avgDuration: number }>;
  }> {
    const toolCalls = await this.repository.find({
      where: {
        teamId,
        isDeleted: false,
      },
      select: ['toolName', 'status', 'duration', 'isError'],
    });

    const successCount = toolCalls.filter((t) => t.status === 'completed' && !t.isError).length;
    const failureCount = toolCalls.filter((t) => t.status === 'error' || t.isError).length;
    const totalDuration = toolCalls.reduce((sum, t) => sum + (t.duration || 0), 0);
    const averageDuration = toolCalls.length > 0 ? totalDuration / toolCalls.length : 0;

    // 按工具分组统计
    const byTool: Record<string, { calls: number; avgDuration: number; totalDuration: number }> = {};
    for (const call of toolCalls) {
      if (!byTool[call.toolName]) {
        byTool[call.toolName] = { calls: 0, avgDuration: 0, totalDuration: 0 };
      }
      byTool[call.toolName].calls++;
      byTool[call.toolName].totalDuration += call.duration || 0;
    }

    // 计算平均值
    for (const toolName in byTool) {
      const stats = byTool[toolName];
      stats.avgDuration = stats.totalDuration / stats.calls;
      delete (stats as any).totalDuration; // 移除临时字段
    }

    return {
      totalCalls: toolCalls.length,
      successCount,
      failureCount,
      averageDuration,
      byTool,
    };
  }

  /**
   * 删除工具调用（软删除）
   */
  async delete(id: string): Promise<void> {
    await this.repository.update({ id }, { isDeleted: true });
  }
}
