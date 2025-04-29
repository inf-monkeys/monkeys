import { CacheManager } from '@/common/cache';
import { CACHE_TOKEN } from '@/common/common.module';
import { Workflow } from '@inf-monkeys/conductor-javascript';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import axios from 'axios';
import { WorkflowExecutionService } from './workflow.execution.service';

interface WorkflowTrackInfo {
  workflowId: string;
  teamId: string;
  startTime: number;
  lastCheckTime: number;
  callbackUrl?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'TERMINATED' | 'TIMED_OUT';
}

@Injectable()
export class WorkflowTrackerService {
  private readonly TRACKING_PREFIX = 'workflow_tracking:';
  private readonly POLLING_INTERVAL = 10 * 1000; // 10秒
  private readonly MAX_EXECUTION_TIME = 24 * 60 * 60; // 24小时（单位：秒）

  constructor(
    @Inject(CACHE_TOKEN) private readonly cacheManager: CacheManager,
    @Inject(forwardRef(() => WorkflowExecutionService))
    private readonly workflowExecutionService: WorkflowExecutionService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.startPolling();
  }

  // 注册工作流追踪
  async registerWorkflowTracking(params: { workflowInstanceId: string; workflowId: string; teamId: string; callbackUrl?: string }) {
    const trackInfo: WorkflowTrackInfo = {
      workflowId: params.workflowId,
      teamId: params.teamId,
      startTime: Date.now(),
      lastCheckTime: Date.now(),
      callbackUrl: params.callbackUrl,
      status: 'PENDING',
    };

    // 使用 Redis 存储追踪信息
    await this.cacheManager.set(`${this.TRACKING_PREFIX}${params.workflowInstanceId}`, JSON.stringify(trackInfo), 'EX', this.MAX_EXECUTION_TIME);
  }

  // 开始轮询
  private async startPolling() {
    setInterval(async () => {
      try {
        // 获取所有追踪中的工作流
        const pattern = `${this.TRACKING_PREFIX}*`;
        const keys = await this.getAllTrackingKeys(pattern);

        for (const key of keys) {
          const trackInfoStr = await this.cacheManager.get(key);
          if (!trackInfoStr) continue;

          const trackInfo: WorkflowTrackInfo = JSON.parse(trackInfoStr);
          const workflowInstanceId = key.replace(this.TRACKING_PREFIX, '');

          // 检查是否超时
          if ((Date.now() - trackInfo.startTime) / 1000 > this.MAX_EXECUTION_TIME) {
            await this.cacheManager.del(key);
            continue;
          }

          // 检查工作流状态
          try {
            const executionDetail = await this.workflowExecutionService.getWorkflowExecutionDetail(trackInfo.teamId, workflowInstanceId);
            const status = executionDetail.status;
            const finished = status === 'COMPLETED' || status === 'FAILED' || status === 'TERMINATED' || status === 'TIMED_OUT';

            if (finished) {
              // 完成后删除
              await this.cacheManager.del(key);
              // 执行回调
              if (trackInfo.callbackUrl) {
                this.executeCallback(trackInfo.callbackUrl, {
                  workflowInstanceId,
                  status,
                  result: executionDetail,
                });
              }

              // 发送事件通知
              await this.sendNotification(workflowInstanceId, executionDetail);
            }
          } catch (error) {
            if ((error as unknown as { status: number }).status === 404) {
              await this.cacheManager.del(key);
              continue;
            }
            console.error(`Error checking workflow status: ${workflowInstanceId}`, error);
          }
        }
      } catch (error) {
        console.error('Error in polling workflow status:', error);
      }
    }, this.POLLING_INTERVAL);
  }

  private async getAllTrackingKeys(pattern: string): Promise<string[]> {
    if (this.cacheManager.isRedis()) {
      // 如果是 Redis，可以使用 KEYS 命令（注意：生产环境建议使用 SCAN）
      return await (this.cacheManager as any).redis.keys(pattern);
    } else {
      // 如果是内存缓存，需要实现自己的模式匹配逻辑
      return Object.keys((this.cacheManager as any).storage).filter((key) => key.startsWith(this.TRACKING_PREFIX));
    }
  }

  private async executeCallback(callbackUrl: string, data: any) {
    try {
      await axios.post(callbackUrl, data, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error(`Callback failed for URL ${callbackUrl}:`, error);
    }
  }

  private async sendNotification(workflowInstanceId: string, result: Workflow) {
    this.eventEmitter.emit(`workflow.completed.${workflowInstanceId}`, {
      workflowInstanceId,
      result,
      timestamp: Date.now(),
    });
  }
}
