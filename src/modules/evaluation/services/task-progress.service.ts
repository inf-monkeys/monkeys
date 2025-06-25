import { CacheManager } from '@/common/cache';
import { CACHE_TOKEN, MQ_TOKEN } from '@/common/common.module';
import { Mq } from '@/common/mq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { TaskProgress } from '../types/task.types';

@Injectable()
export class TaskProgressService {
  private readonly logger = new Logger(TaskProgressService.name);
  private readonly PROGRESS_PREFIX = 'evaluation:progress';
  private readonly EVENTS_PREFIX = 'evaluation:events';

  constructor(
    @Inject(CACHE_TOKEN) private readonly cache: CacheManager,
    @Inject(MQ_TOKEN) private readonly mq: Mq,
  ) {}

  async updateProgress(taskId: string, completed: number, total: number, current?: string, failed: number = 0): Promise<void> {
    const progress: TaskProgress = {
      total,
      completed,
      failed,
      current,
      percentage: Math.round((completed / total) * 100),
    };

    await this.cache.setex(
      `${this.PROGRESS_PREFIX}:${taskId}`,
      3600, // 1小时过期
      JSON.stringify(progress),
    );

    await this.publishProgressEvent(taskId, progress);

    this.logger.debug(`Updated progress for task ${taskId}: ${completed}/${total} (${progress.percentage}%)`);
  }

  async getProgress(taskId: string): Promise<TaskProgress | null> {
    const progressData = await this.cache.get(`${this.PROGRESS_PREFIX}:${taskId}`);
    if (!progressData) return null;

    return JSON.parse(progressData);
  }

  async incrementCompleted(taskId: string, current?: string): Promise<TaskProgress | null> {
    const progress = await this.getProgress(taskId);
    if (!progress) return null;

    progress.completed += 1;
    progress.percentage = Math.round((progress.completed / progress.total) * 100);
    if (current) progress.current = current;

    await this.cache.setex(`${this.PROGRESS_PREFIX}:${taskId}`, 3600, JSON.stringify(progress));

    await this.publishProgressEvent(taskId, progress);

    return progress;
  }

  async incrementFailed(taskId: string, current?: string): Promise<TaskProgress | null> {
    const progress = await this.getProgress(taskId);
    if (!progress) return null;

    progress.failed += 1;
    if (current) progress.current = current;

    await this.cache.setex(`${this.PROGRESS_PREFIX}:${taskId}`, 3600, JSON.stringify(progress));

    await this.publishProgressEvent(taskId, progress);

    return progress;
  }

  async subscribeToProgress(taskId: string, callback: (progress: TaskProgress) => void): Promise<void> {
    const channel = `${this.EVENTS_PREFIX}:${taskId}`;

    this.mq.subscribe(channel, (receivedChannel, message) => {
      if (receivedChannel === channel) {
        try {
          const progress = JSON.parse(message);
          callback(progress);
        } catch (error) {
          this.logger.error(`Failed to parse progress message: ${error.message}`);
        }
      }
    });

    this.logger.debug(`Subscribed to progress updates for task ${taskId}`);
  }

  private async publishProgressEvent(taskId: string, progress: TaskProgress): Promise<void> {
    const channel = `${this.EVENTS_PREFIX}:${taskId}`;
    await this.mq.publish(channel, JSON.stringify(progress));
  }

  async cleanupProgress(taskId: string): Promise<void> {
    await this.cache.del(`${this.PROGRESS_PREFIX}:${taskId}`);
    this.logger.debug(`Cleaned up progress for task ${taskId}`);
  }

  async getAllActiveProgresses(): Promise<Array<{ taskId: string; progress: TaskProgress }>> {
    const keys = await this.cache.keys(`${this.PROGRESS_PREFIX}:*`);
    const results = [];

    for (const key of keys) {
      const taskId = key.split(':').pop();
      const progressData = await this.cache.get(key);

      if (progressData && taskId) {
        try {
          const progress = JSON.parse(progressData);
          results.push({ taskId, progress });
        } catch (error) {
          this.logger.error(`Failed to parse progress for ${taskId}: ${error.message}`);
        }
      }
    }

    return results;
  }

  async isTaskCompleted(taskId: string): Promise<boolean> {
    const progress = await this.getProgress(taskId);
    if (!progress) return false;

    return progress.completed + progress.failed >= progress.total;
  }

  async getCompletionRate(taskId: string): Promise<number> {
    const progress = await this.getProgress(taskId);
    if (!progress || progress.total === 0) return 0;

    return (progress.completed + progress.failed) / progress.total;
  }
}
