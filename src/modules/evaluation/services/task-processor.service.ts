import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { EvaluationService } from '../evaluation.service';
import { TaskStatus } from '../types/task.types';
import { TaskProgressService } from './task-progress.service';
import { TaskQueueService } from './task-queue.service';

@Injectable()
export class TaskProcessorService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(TaskProcessorService.name);
  private isProcessing = false;
  private shouldStop = false;
  private processingPromise?: Promise<void>;

  constructor(
    private readonly taskQueueService: TaskQueueService,
    private readonly taskProgressService: TaskProgressService,
    private readonly evaluationService: EvaluationService,
  ) {}

  onApplicationBootstrap() {
    this.startProcessing();
  }

  onApplicationShutdown() {
    this.stopProcessing();
  }

  private async startProcessing(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.shouldStop = false;

    this.logger.log('Started task processor');

    this.processingPromise = this.processLoop();
  }

  private async stopProcessing(): Promise<void> {
    this.shouldStop = true;

    if (this.processingPromise) {
      await this.processingPromise;
    }

    this.isProcessing = false;
    this.logger.log('Stopped task processor');
  }

  private async processLoop(): Promise<void> {
    while (!this.shouldStop) {
      try {
        const taskId = await this.taskQueueService.getNextTask();

        if (!taskId) {
          continue; // getNextTask 会阻塞等待，超时后返回null
        }

        await this.processTask(taskId);
      } catch (error) {
        this.logger.error(`Error in process loop: ${error.message}`, error.stack);
        await this.sleep(5000); // 错误后等待5秒再继续
      }
    }
  }

  private async processTask(taskId: string): Promise<void> {
    try {
      this.logger.log(`Processing task ${taskId}`);

      const task = await this.taskQueueService.getTask(taskId);
      if (!task) {
        this.logger.warn(`Task ${taskId} not found`);
        return;
      }

      if (task.status !== TaskStatus.PENDING) {
        this.logger.warn(`Task ${taskId} is not in pending status: ${task.status}`);
        return;
      }

      await this.taskQueueService.markTaskAsProcessing(taskId);

      const battleGroup = await this.evaluationService.getBattleGroup(task.battleGroupId);
      if (!battleGroup) {
        throw new Error(`Battle group ${task.battleGroupId} not found`);
      }

      const pendingBattles = await this.evaluationService.getBattlesByGroup(task.battleGroupId, 'PENDING');

      if (pendingBattles.length === 0) {
        await this.taskQueueService.markTaskAsCompleted(taskId);
        return;
      }

      await this.taskProgressService.updateProgress(taskId, 0, pendingBattles.length, 'Starting evaluation...', 0);

      let completed = 0;
      let failed = 0;

      for (const battle of pendingBattles) {
        if (this.shouldStop) {
          this.logger.log(`Task ${taskId} interrupted due to shutdown`);
          return;
        }

        try {
          this.logger.debug(`Processing battle ${battle.id} for task ${taskId}`);

          await this.taskProgressService.updateProgress(taskId, completed, pendingBattles.length, `Evaluating battle ${battle.id}`, failed);

          const evaluationResult = await this.evaluationService.autoEvaluateBattle(battle.id);
          this.logger.debug(`Battle ${battle.id} evaluation result: ${JSON.stringify(evaluationResult)}`);

          if (evaluationResult.success) {
            completed++;
            await this.taskProgressService.incrementCompleted(taskId, `Completed battle ${battle.id}`);
            this.logger.debug(`Completed battle ${battle.id} for task ${taskId}`);
          } else {
            failed++;
            const errorMessage = `Failed to evaluate battle ${battle.id}: ${evaluationResult.error}`;
            this.logger.error(errorMessage);
            await this.taskProgressService.incrementFailed(taskId, errorMessage);
          }
        } catch (error) {
          failed++;
          this.logger.error(`Failed to evaluate battle ${battle.id}: ${error.message}`);

          await this.taskProgressService.incrementFailed(taskId, `Failed battle ${battle.id}: ${error.message}`);
        }

        await this.sleep(1000);
      }

      await this.taskProgressService.updateProgress(taskId, completed, pendingBattles.length, 'Evaluation completed', failed);

      if (failed === 0) {
        await this.taskQueueService.markTaskAsCompleted(taskId);
        this.logger.log(`Task ${taskId} completed successfully: ${completed}/${pendingBattles.length} battles`);
      } else {
        await this.taskQueueService.markTaskAsFailed(taskId, `Completed with errors: ${completed} succeeded, ${failed} failed`);
        this.logger.warn(`Task ${taskId} completed with errors: ${completed}/${pendingBattles.length} battles succeeded`);
      }
    } catch (error) {
      this.logger.error(`Failed to process task ${taskId}: ${error.message}`, error.stack);
      await this.taskQueueService.markTaskAsFailed(taskId, error.message);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getProcessorStatus(): Promise<{
    isProcessing: boolean;
    queueLength: { pending: number; processing: number };
  }> {
    const queueLength = await this.taskQueueService.getQueueLength();

    return {
      isProcessing: this.isProcessing,
      queueLength,
    };
  }

  async forceStopTask(taskId: string): Promise<boolean> {
    const task = await this.taskQueueService.getTask(taskId);
    if (!task) return false;

    if (task.status === TaskStatus.PROCESSING) {
      this.logger.warn(`Cannot force stop task ${taskId} - it is currently being processed`);
      return false;
    }

    return await this.taskQueueService.cancelTask(taskId);
  }

  async retryFailedTask(taskId: string): Promise<boolean> {
    const task = await this.taskQueueService.getTask(taskId);
    if (!task || task.status !== TaskStatus.FAILED) {
      return false;
    }

    await this.taskQueueService.updateTaskStatus(taskId, TaskStatus.PENDING);
    await this.taskQueueService.addTaskToQueue(taskId);

    this.logger.log(`Retrying failed task ${taskId}`);
    return true;
  }
}
