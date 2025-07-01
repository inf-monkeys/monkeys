import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { EvaluationService } from '../evaluation.service';
import { OpenSkillService } from './openskill.service';

interface AutoEvaluationJob {
  teamId: string;
  moduleId: string;
  interval: NodeJS.Timeout | null;
  isActive: boolean;
}

@Injectable()
export class AutoEvaluationService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(AutoEvaluationService.name);
  private readonly activeJobs = new Map<string, AutoEvaluationJob>();
  private readonly completedModules = new Set<string>();
  private readonly EVALUATION_INTERVAL = 10000; // 10秒检查一次
  private globalShutdown = false;

  constructor(
    private readonly openskillService: OpenSkillService,
    private readonly evaluationService: EvaluationService,
  ) {}

  onApplicationBootstrap() {
    this.logger.log('Auto Evaluation Service started');
  }

  onApplicationShutdown() {
    this.globalShutdown = true;
    this.stopAllJobs();
    this.logger.log('Auto Evaluation Service stopped');
  }

  /**
   * 启动模块的自动评测
   */
  async startEvaluation(teamId: string, moduleId: string): Promise<void> {
    const jobKey = `${teamId}:${moduleId}`;

    if (this.activeJobs.has(jobKey)) {
      this.logger.debug(`Auto evaluation already running for module ${moduleId}`);
      return;
    }

    // 如果任务要重新开始，先从“已完成”列表里移除
    this.completedModules.delete(moduleId);

    const job: AutoEvaluationJob = {
      teamId,
      moduleId,
      interval: null,
      isActive: true,
    };

    this.activeJobs.set(jobKey, job);

    // 立即执行一次
    await this.processBattles(teamId, moduleId);

    // 设置定时器
    job.interval = setInterval(async () => {
      if (!this.globalShutdown && job.isActive) {
        try {
          await this.processBattles(teamId, moduleId);
        } catch (error) {
          this.logger.error(`Error in auto evaluation for module ${moduleId}: ${error.message}`);
        }
      }
    }, this.EVALUATION_INTERVAL);

    this.logger.log(`Started auto evaluation for module ${moduleId}`);
  }

  /**
   * 停止模块的自动评测
   */
  stopEvaluation(teamId: string, moduleId: string): void {
    const jobKey = `${teamId}:${moduleId}`;
    const job = this.activeJobs.get(jobKey);

    if (job) {
      job.isActive = false;
      if (job.interval) {
        clearInterval(job.interval);
      }
      this.activeJobs.delete(jobKey);
      this.completedModules.add(moduleId); // 标记为已完成
      this.logger.log(`Stopped auto evaluation for module ${moduleId}`);
    }
  }

  /**
   * 停止所有自动评测任务
   */
  private stopAllJobs(): void {
    for (const [, job] of this.activeJobs.entries()) {
      job.isActive = false;
      if (job.interval) {
        clearInterval(job.interval);
      }
    }
    this.activeJobs.clear();
  }

  /**
   * 处理对战
   */
  private async processBattles(teamId: string, moduleId: string): Promise<void> {
    try {
      // 检查评测是否已完成
      const status = await this.openskillService.getEvaluationStatus(teamId, moduleId);

      if (status.isComplete) {
        this.logger.log(`Evaluation completed for module ${moduleId}, stopping auto evaluation.`);
        this.stopEvaluation(teamId, moduleId);
        return; // 关键修复：立即返回，停止当前执行流程
      }

      // 获取下一场最优对战
      const battle = await this.openskillService.getNextOptimalBattle(teamId, moduleId);

      if (!battle) {
        this.logger.debug(`No optimal battle found for module ${moduleId}`);
        return;
      }

      this.logger.log(`Processing battle: ${battle.assetAId} vs ${battle.assetBId} (quality: ${battle.quality.toFixed(3)})`);

      // 创建数据库中的battle记录
      const battleEntity = await this.evaluationService.createBattle(moduleId, battle.assetAId, battle.assetBId);

      // 使用现有的LLM评测方法
      const result = await this.evaluationService.autoEvaluateBattle(battleEntity.id);

      if (result.success) {
        this.logger.log(`Battle evaluation completed successfully: ${battleEntity.id}, result: ${result.result}`);

        // 将结果反馈给OpenSkill
        await this.openskillService.updateBattleResult(teamId, moduleId, {
          assetAId: battle.assetAId,
          assetBId: battle.assetBId,
          winner: result.result === 'A_WIN' ? 'A' : result.result === 'B_WIN' ? 'B' : 'DRAW',
          battleId: battleEntity.id,
        });
      } else {
        this.logger.error(`Battle evaluation failed: ${battleEntity.id}, error: ${result.error}`);
      }
    } catch (error) {
      this.logger.error(`Error processing battles for module ${moduleId}: ${error.message}`);
    }
  }

  /**
   * 获取活跃的评测任务状态
   */
  getActiveJobs(): Array<{ teamId: string; moduleId: string; isActive: boolean }> {
    return Array.from(this.activeJobs.entries()).map(([key, job]) => {
      const [teamId, moduleId] = key.split(':');
      return {
        teamId,
        moduleId,
        isActive: job.isActive,
      };
    });
  }
  /**
   * 检查一个模块的评测是否已经完成
   */
  isEvaluationComplete(moduleId: string): boolean {
    return this.completedModules.has(moduleId);
  }
}
