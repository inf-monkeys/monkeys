import { EvaluationTaskEntity, TaskStatus, TaskType } from '@/database/entities/evaluation/evaluation-task.entity';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EvaluationService } from '../evaluation.service';
import { AutoEvaluationService } from './auto-evaluation.service';
import { OpenSkillService } from './openskill.service';
import { PgTaskQueueService } from './pg-task-queue.service';

@Injectable()
export class PgTaskProcessorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PgTaskProcessorService.name);
  private processingInterval: NodeJS.Timeout;
  private readonly POLL_INTERVAL = 1000; // 1秒轮询一次
  private isProcessing = false;

  constructor(
    private readonly taskQueueService: PgTaskQueueService,
    private readonly evaluationService: EvaluationService,
    private readonly openSkillService: OpenSkillService,
    private readonly autoEvaluationService: AutoEvaluationService,
  ) {}

  async onModuleInit() {
    this.logger.log('PgTaskProcessorService onModuleInit called');
    try {
      this.startProcessing();
    } catch (error) {
      this.logger.error('Failed to start task processor:', error);
    }
  }

  async onModuleDestroy() {
    this.stopProcessing();
  }

  private startProcessing() {
    this.logger.log('Starting PostgreSQL task processor');
    this.processingInterval = setInterval(async () => {
      if (!this.isProcessing) {
        await this.processNextTask();
      }
    }, this.POLL_INTERVAL);
  }

  private stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.logger.log('Stopped PostgreSQL task processor');
    }
  }

  private async processNextTask(): Promise<void> {
    try {
      this.isProcessing = true;

      const task = await this.taskQueueService.getNextTask();
      if (!task) {
        // 没有待处理任务，继续轮询
        return;
      }

      this.logger.log(`Processing task ${task.id} of type ${task.type}`);

      try {
        await this.executeTask(task);
        await this.taskQueueService.updateTaskStatus(task.id, TaskStatus.COMPLETED);
        this.logger.log(`Task ${task.id} completed successfully`);
      } catch (error) {
        this.logger.error(`Task ${task.id} failed:`, error);
        await this.taskQueueService.updateTaskStatus(task.id, TaskStatus.FAILED, error.message);
      }
    } catch (error) {
      this.logger.error('Error in task processing loop:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async executeTask(task: EvaluationTaskEntity): Promise<void> {
    switch (task.type) {
      case TaskType.ADD_ASSETS_TO_MODULE:
        await this.processAddAssetsTask(task);
        break;

      case TaskType.EVALUATE_BATTLE_GROUP:
        await this.processEvaluateBattleGroupTask(task);
        break;

      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private async processAddAssetsTask(task: EvaluationTaskEntity): Promise<void> {
    const { assetIds } = task.payload;
    if (!assetIds || !Array.isArray(assetIds)) {
      throw new Error('Invalid payload: assetIds is required');
    }

    let completed = 0;
    let failed = 0;

    for (const assetId of assetIds) {
      try {
        await this.openSkillService.addAssetToModule(task.teamId, task.moduleId, assetId);
        completed++;
      } catch (error) {
        this.logger.error(`Failed to add asset ${assetId} to module ${task.moduleId}:`, error);
        failed++;
      }

      // 更新进度
      await this.taskQueueService.updateTaskProgress(task.id, completed, failed, `Processing asset ${assetId}`);
    }

    this.logger.log(`Task ${task.id} completed: ${completed}/${assetIds.length} assets added`);

    // 启动自动评估
    try {
      await this.autoEvaluationService.startEvaluation(task.teamId, task.moduleId);
      this.logger.log(`Auto evaluation started for module ${task.moduleId}`);
    } catch (error) {
      this.logger.error(`Failed to start auto evaluation for module ${task.moduleId}:`, error);
    }
  }

  private async processEvaluateBattleGroupTask(task: EvaluationTaskEntity): Promise<void> {
    const { battleGroupId } = task.payload;
    if (!battleGroupId) {
      throw new Error('Invalid payload: battleGroupId is required');
    }

    // 获取待评测的对战
    const battles = await this.evaluationService.getBattlesByGroup(battleGroupId, 'PENDING');

    let completed = 0;
    let failed = 0;

    for (const battle of battles) {
      try {
        const result = await this.evaluationService.autoEvaluateBattle(battle.id);
        if (result.success) {
          completed++;
        } else {
          failed++;
          this.logger.error(`Battle ${battle.id} evaluation failed: ${result.error}`);
        }
      } catch (error) {
        failed++;
        this.logger.error(`Battle ${battle.id} evaluation error:`, error);
      }

      // 更新进度
      await this.taskQueueService.updateTaskProgress(task.id, completed, failed, `Evaluating battle ${battle.id}`);
    }

    this.logger.log(`Task ${task.id} completed: ${completed}/${battles.length} battles evaluated`);
  }

  /**
   * 手动触发任务处理（用于测试）
   */
  async processTasksManually(): Promise<void> {
    if (this.isProcessing) {
      this.logger.warn('Task processing already in progress');
      return;
    }

    await this.processNextTask();
  }

  /**
   * 获取处理器状态
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      pollInterval: this.POLL_INTERVAL,
    };
  }
}
