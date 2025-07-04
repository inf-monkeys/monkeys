import { generateDbId } from '@/common/utils';
import { EvaluationTaskEntity, TaskStatus } from '@/database/entities/evaluation/evaluation-task.entity';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { TaskType } from '../types/task.types';

export interface CreateTaskPayload {
  type: TaskType;
  moduleId: string;
  teamId: string;
  userId: string;
  total: number;
  payload: any;
}

export interface PgTaskProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
  percentage: number;
}

@Injectable()
export class PgTaskQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PgTaskQueueService.name);
  private readonly processorId = uuidv4(); // 唯一的处理器实例ID
  private recoveryInterval: NodeJS.Timeout;

  constructor(
    @InjectRepository(EvaluationTaskEntity)
    private readonly taskRepository: Repository<EvaluationTaskEntity>,
  ) {}

  async onModuleInit() {
    this.logger.log(`Task queue service started with processor ID: ${this.processorId}`);

    // 启动时恢复僵尸任务
    await this.recoverZombieTasks();

    // 定期检查并恢复僵尸任务（每5分钟）
    this.recoveryInterval = setInterval(
      async () => {
        await this.recoverZombieTasks();
      },
      5 * 60 * 1000,
    );
  }

  async onModuleDestroy() {
    if (this.recoveryInterval) {
      clearInterval(this.recoveryInterval);
    }

    // 清理当前实例的正在处理任务
    await this.cleanupProcessingTasks();
  }

  /**
   * 创建新任务
   */
  async createTask(payload: CreateTaskPayload): Promise<EvaluationTaskEntity> {
    const task = this.taskRepository.create({
      id: generateDbId(),
      type: payload.type,
      moduleId: payload.moduleId,
      teamId: payload.teamId,
      userId: payload.userId,
      status: TaskStatus.PENDING,
      total: payload.total,
      completed: 0,
      failed: 0,
      payload: payload.payload,
    });

    const savedTask = await this.taskRepository.save(task);
    this.logger.log(`Created task ${savedTask.id} of type ${savedTask.type} for team ${savedTask.teamId}`);
    return savedTask;
  }

  /**
   * 获取下一个待处理任务（原子操作，支持多租户）
   */
  async getNextTask(teamId?: string): Promise<EvaluationTaskEntity | null> {
    return await this.taskRepository.manager.transaction(async (manager) => {
      // 构建查询条件，支持多租户隔离
      const queryBuilder = manager
        .createQueryBuilder(EvaluationTaskEntity, 'task')
        .where('task.status = :status', { status: TaskStatus.PENDING })
        .orderBy('task.createdTimestamp', 'ASC')
        .setLock('pessimistic_write_or_fail');

      // 如果指定了teamId，只处理该租户的任务
      if (teamId) {
        queryBuilder.andWhere('task.teamId = :teamId', { teamId });
      }

      const task = await queryBuilder.getOne();

      if (task) {
        // 立即更新状态，防止重复处理
        const now = new Date();
        task.status = TaskStatus.PROCESSING;
        task.startedAt = now;
        task.heartbeatAt = now;
        task.processorId = this.processorId;
        await manager.save(task);

        this.logger.log(`[${this.processorId}] Picked up task ${task.id} for team ${task.teamId}`);
        return task;
      }

      return null;
    });
  }

  /**
   * 更新任务状态
   */
  async updateTaskStatus(taskId: string, status: TaskStatus, error?: string): Promise<void> {
    const updateData: Partial<EvaluationTaskEntity> = { status };

    if (status === TaskStatus.COMPLETED || status === TaskStatus.FAILED) {
      updateData.completedAt = new Date();
    }

    if (error) {
      updateData.error = error;
    }

    await this.taskRepository.update(taskId, updateData);
    this.logger.log(`Updated task ${taskId} status to ${status}`);
  }

  /**
   * 更新任务进度
   */
  async updateTaskProgress(taskId: string, completed: number, failed: number, currentItem?: string): Promise<void> {
    const updateData: Partial<EvaluationTaskEntity> = {
      completed,
      failed,
    };

    if (currentItem) {
      updateData.currentItem = currentItem;
    }

    await this.taskRepository.update(taskId, updateData);

    // 获取更新后的任务计算百分比
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (task) {
    }
  }

  /**
   * 获取任务详情
   */
  async getTask(taskId: string): Promise<EvaluationTaskEntity | null> {
    return await this.taskRepository.findOne({ where: { id: taskId } });
  }

  /**
   * 获取用户任务列表
   */
  async getUserTasks(userId: string, teamId: string, page: number = 1, limit: number = 20): Promise<{ tasks: EvaluationTaskEntity[]; total: number }> {
    const [tasks, total] = await this.taskRepository.findAndCount({
      where: { userId, teamId },
      order: { createdTimestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { tasks, total };
  }

  /**
   * 获取模块任务列表
   */
  async getModuleTasks(moduleId: string, status?: TaskStatus, page: number = 1, limit: number = 20): Promise<{ tasks: EvaluationTaskEntity[]; total: number }> {
    const where: any = { moduleId };
    if (status) {
      where.status = status;
    }

    const [tasks, total] = await this.taskRepository.findAndCount({
      where,
      order: { createdTimestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { tasks, total };
  }

  /**
   * 清理旧任务（可选的维护功能）
   */
  async cleanupOldTasks(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.taskRepository
      .createQueryBuilder()
      .delete()
      .where('completed_at < :cutoffDate', { cutoffDate })
      .andWhere('status IN (:...statuses)', {
        statuses: [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED],
      })
      .execute();

    this.logger.log(`Cleaned up ${result.affected} old tasks`);
    return result.affected || 0;
  }

  /**
   * 获取队列统计信息
   */
  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const stats = await this.taskRepository.createQueryBuilder('task').select('task.status', 'status').addSelect('COUNT(*)', 'count').groupBy('task.status').getRawMany();

    const result = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    stats.forEach((stat) => {
      result[stat.status] = parseInt(stat.count);
    });

    return result;
  }

  /**
   * 获取团队级别的队列统计信息
   */
  async getTeamQueueStats(teamId: string): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const stats = await this.taskRepository
      .createQueryBuilder('task')
      .select('task.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('task.teamId = :teamId', { teamId })
      .groupBy('task.status')
      .getRawMany();

    const result = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    stats.forEach((stat) => {
      result[stat.status] = parseInt(stat.count);
    });

    return result;
  }

  /**
   * 更新任务心跳（表示任务仍在处理中）
   */
  async updateTaskHeartbeat(taskId: string): Promise<void> {
    await this.taskRepository.update({ id: taskId, processorId: this.processorId }, { heartbeatAt: new Date() });
  }

  /**
   * 恢复僵尸任务（超时或实例崩溃的任务）
   */
  async recoverZombieTasks(): Promise<number> {
    try {
      // 查找超时的处理中任务
      const zombieTasks = await this.taskRepository
        .createQueryBuilder('task')
        .where('task.status = :status', { status: TaskStatus.PROCESSING })
        .andWhere(
          `
          task.heartbeat_at IS NULL 
          OR task.heartbeat_at < NOW() - INTERVAL '1 minute' * task.timeout_minutes
        `,
        )
        .getMany();

      let recovered = 0;
      for (const task of zombieTasks) {
        if (task.canRetry) {
          // 重试任务
          await this.retryTask(task);
          recovered++;
          this.logger.warn(`Recovered zombie task ${task.id} (retry ${task.retryCount + 1}/${task.maxRetries})`);
        } else {
          // 标记为失败
          await this.taskRepository.update(task.id, {
            status: TaskStatus.FAILED,
            error: `Task timeout after ${task.retryCount} retries`,
            completedAt: new Date(),
          });
          this.logger.error(`Failed zombie task ${task.id} - exceeded max retries`);
        }
      }

      if (recovered > 0) {
        this.logger.log(`Recovered ${recovered} zombie tasks`);
      }

      return recovered;
    } catch (error) {
      this.logger.error('Error recovering zombie tasks:', error);
      return 0;
    }
  }

  /**
   * 重试失败的任务
   */
  private async retryTask(task: EvaluationTaskEntity): Promise<void> {
    await this.taskRepository.update(task.id, {
      status: TaskStatus.PENDING,
      retryCount: task.retryCount + 1,
      startedAt: null,
      processorId: null,
      heartbeatAt: null,
      error: null,
    });
  }

  /**
   * 清理当前实例的正在处理任务
   */
  private async cleanupProcessingTasks(): Promise<void> {
    const result = await this.taskRepository.update(
      { processorId: this.processorId, status: TaskStatus.PROCESSING },
      {
        status: TaskStatus.PENDING,
        processorId: null,
        heartbeatAt: null,
        error: 'Instance shutdown - task reset for retry',
      },
    );

    if (result.affected && result.affected > 0) {
      this.logger.log(`Reset ${result.affected} processing tasks due to instance shutdown`);
    }
  }

  /**
   * 获取实例统计信息（完整计算）
   */
  async getInstanceStats(): Promise<{
    processorId: string;
    processingTasks: number;
    totalCompleted: number;
    totalFailed: number;
    totalProcessed: number;
    averageProcessingTime: number;
    uptime: string;
    lastTaskCompletedAt?: Date;
  }> {
    // 并行执行多个统计查询提高性能
    const [processingTasks, completedStats, failedCount, avgProcessingTime, lastCompleted] = await Promise.all([
      // 当前正在处理的任务数
      this.taskRepository.count({
        where: { processorId: this.processorId, status: TaskStatus.PROCESSING },
      }),

      // 已完成任务统计
      this.taskRepository
        .createQueryBuilder('task')
        .select('COUNT(*)', 'count')
        .addSelect('AVG(EXTRACT(EPOCH FROM (completed_at - started_at)))', 'avgTime')
        .where('task.processorId = :processorId', { processorId: this.processorId })
        .andWhere('task.status = :status', { status: TaskStatus.COMPLETED })
        .andWhere('task.startedAt IS NOT NULL')
        .andWhere('task.completedAt IS NOT NULL')
        .getRawOne(),

      // 失败任务数
      this.taskRepository.count({
        where: { processorId: this.processorId, status: TaskStatus.FAILED },
      }),

      // 平均处理时间（所有已完成任务）
      this.taskRepository
        .createQueryBuilder('task')
        .select('AVG(EXTRACT(EPOCH FROM (completed_at - started_at)))', 'avgTime')
        .where('task.processorId = :processorId', { processorId: this.processorId })
        .andWhere('task.status = :status', { status: TaskStatus.COMPLETED })
        .andWhere('task.startedAt IS NOT NULL')
        .andWhere('task.completedAt IS NOT NULL')
        .getRawOne(),

      // 最后完成的任务时间
      this.taskRepository.findOne({
        where: { processorId: this.processorId, status: TaskStatus.COMPLETED },
        order: { completedAt: 'DESC' },
        select: ['completedAt'],
      }),
    ]);

    const totalCompleted = parseInt(completedStats?.count) || 0;
    const totalProcessed = totalCompleted + failedCount;
    const averageProcessingTime = parseFloat(avgProcessingTime?.avgTime) || 0;

    return {
      processorId: this.processorId,
      processingTasks,
      totalCompleted,
      totalFailed: failedCount,
      totalProcessed,
      averageProcessingTime: Math.round(averageProcessingTime * 100) / 100, // 秒，保留2位小数
      uptime: this.formatUptime(process.uptime()),
      lastTaskCompletedAt: lastCompleted?.completedAt,
    };
  }

  /**
   * 获取全局队列统计（所有实例）
   */
  async getGlobalQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    activeProcessors: number;
    oldestPendingTask?: number;
    totalThroughput: number; // 任务/小时
  }> {
    const [statusStats, processorCount, oldestPending, hourlyThroughput] = await Promise.all([
      // 按状态统计
      this.taskRepository.createQueryBuilder('task').select('task.status', 'status').addSelect('COUNT(*)', 'count').groupBy('task.status').getRawMany(),

      // 活跃处理器数量
      this.taskRepository
        .createQueryBuilder('task')
        .select('COUNT(DISTINCT task.processorId)', 'count')
        .where('task.status = :status', { status: TaskStatus.PROCESSING })
        .andWhere('task.processorId IS NOT NULL')
        .getRawOne(),

      // 最旧的待处理任务
      this.taskRepository.findOne({
        where: { status: TaskStatus.PENDING },
        order: { createdTimestamp: 'ASC' },
        select: ['createdTimestamp'],
      }),

      // 过去1小时的吞吐量
      this.taskRepository.createQueryBuilder('task').where('task.status = :status', { status: TaskStatus.COMPLETED }).andWhere("task.completed_at > NOW() - INTERVAL '1 hour'").getCount(),
    ]);

    const result = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      activeProcessors: parseInt(processorCount?.count) || 0,
      oldestPendingTask: oldestPending?.createdTimestamp,
      totalThroughput: hourlyThroughput,
    };

    // 解析状态统计
    statusStats.forEach((stat) => {
      const status = stat.status as TaskStatus;
      const count = parseInt(stat.count);
      if (result.hasOwnProperty(status)) {
        result[status] = count;
      }
    });

    return result;
  }

  /**
   * 格式化运行时间
   */
  private formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
}
