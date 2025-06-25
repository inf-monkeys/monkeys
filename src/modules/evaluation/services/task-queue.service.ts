import { CacheManager } from '@/common/cache';
import { CACHE_TOKEN } from '@/common/common.module';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EvaluationTask, TaskProgress, TaskStatus } from '../types/task.types';

@Injectable()
export class TaskQueueService {
  private readonly logger = new Logger(TaskQueueService.name);
  private readonly TASK_PREFIX = 'evaluation:task';
  private readonly QUEUE_PREFIX = 'evaluation:queue';
  private readonly PROGRESS_PREFIX = 'evaluation:progress';

  constructor(@Inject(CACHE_TOKEN) private readonly redis: CacheManager) {}

  async createTask(battleGroupId: string, moduleId: string, teamId: string, userId: string, totalBattles: number): Promise<EvaluationTask> {
    const taskId = uuidv4();
    const task: EvaluationTask = {
      id: taskId,
      battleGroupId,
      moduleId,
      teamId,
      userId,
      status: TaskStatus.PENDING,
      progress: {
        total: totalBattles,
        completed: 0,
        failed: 0,
        percentage: 0,
      },
      createdAt: new Date(),
    };

    await this.redis.setex(
      `${this.TASK_PREFIX}:${taskId}`,
      3600 * 24, // 24小时过期
      JSON.stringify(task),
    );

    await this.redis.lpush(`${this.QUEUE_PREFIX}:pending`, taskId);

    this.logger.log(`Created evaluation task ${taskId} for battle group ${battleGroupId}`);
    return task;
  }

  async getTask(taskId: string): Promise<EvaluationTask | null> {
    const taskData = await this.redis.get(`${this.TASK_PREFIX}:${taskId}`);
    if (!taskData) return null;

    return JSON.parse(taskData);
  }

  async updateTaskStatus(taskId: string, status: TaskStatus, error?: string): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task) return;

    task.status = status;
    if (error) task.error = error;

    if (status === TaskStatus.PROCESSING && !task.startedAt) {
      task.startedAt = new Date();
    }

    if (status === TaskStatus.COMPLETED || status === TaskStatus.FAILED) {
      task.completedAt = new Date();
    }

    await this.redis.setex(`${this.TASK_PREFIX}:${taskId}`, 3600 * 24, JSON.stringify(task));

    this.logger.log(`Updated task ${taskId} status to ${status}`);
  }

  async updateTaskProgress(taskId: string, progress: Partial<TaskProgress>): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task) return;

    task.progress = { ...task.progress, ...progress };
    task.progress.percentage = Math.round((task.progress.completed / task.progress.total) * 100);

    await this.redis.setex(`${this.TASK_PREFIX}:${taskId}`, 3600 * 24, JSON.stringify(task));

    await this.redis.setex(`${this.PROGRESS_PREFIX}:${taskId}`, 3600, JSON.stringify(task.progress));
  }

  async getNextTask(): Promise<string | null> {
    const taskId = await this.redis.brpop(`${this.QUEUE_PREFIX}:pending`, 5);
    if (!taskId) return null;

    await this.redis.lpush(`${this.QUEUE_PREFIX}:processing`, taskId[1]);
    return taskId[1];
  }

  async markTaskAsProcessing(taskId: string): Promise<void> {
    await this.updateTaskStatus(taskId, TaskStatus.PROCESSING);
  }

  async markTaskAsCompleted(taskId: string): Promise<void> {
    await this.updateTaskStatus(taskId, TaskStatus.COMPLETED);
    await this.redis.lrem(`${this.QUEUE_PREFIX}:processing`, 1, taskId);
  }

  async markTaskAsFailed(taskId: string, error: string): Promise<void> {
    await this.updateTaskStatus(taskId, TaskStatus.FAILED, error);
    await this.redis.lrem(`${this.QUEUE_PREFIX}:processing`, 1, taskId);
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const task = await this.getTask(taskId);
    if (!task) return false;

    if (task.status === TaskStatus.PROCESSING) {
      return false; // 不能取消正在处理的任务
    }

    await this.updateTaskStatus(taskId, TaskStatus.CANCELLED);
    await this.redis.lrem(`${this.QUEUE_PREFIX}:pending`, 1, taskId);
    return true;
  }

  async getTasksByUser(teamId: string, userId: string): Promise<EvaluationTask[]> {
    const keys = await this.redis.keys(`${this.TASK_PREFIX}:*`);
    const tasks: EvaluationTask[] = [];

    for (const key of keys) {
      const taskData = await this.redis.get(key);
      if (taskData) {
        const task = JSON.parse(taskData);
        if (task.teamId === teamId && task.userId === userId) {
          tasks.push(task);
        }
      }
    }

    return tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getQueueLength(): Promise<{ pending: number; processing: number }> {
    const pending = await this.redis.llen(`${this.QUEUE_PREFIX}:pending`);
    const processing = await this.redis.llen(`${this.QUEUE_PREFIX}:processing`);

    return { pending, processing };
  }

  async addTaskToQueue(taskId: string): Promise<void> {
    await this.redis.lpush(`${this.QUEUE_PREFIX}:pending`, taskId);
  }

  async cleanupExpiredTasks(): Promise<void> {
    const keys = await this.redis.keys(`${this.TASK_PREFIX}:*`);
    const now = new Date();

    for (const key of keys) {
      const taskData = await this.redis.get(key);
      if (taskData) {
        const task = JSON.parse(taskData);
        const createdAt = new Date(task.createdAt);
        const daysSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceCreated > 7) {
          // 清理7天前的任务
          await this.redis.del(key);
          await this.redis.del(`${this.PROGRESS_PREFIX}:${task.id}`);
        }
      }
    }
  }
}
