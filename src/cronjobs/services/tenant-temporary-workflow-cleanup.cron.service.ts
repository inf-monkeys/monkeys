import { logger } from '@/common/logger';
import { TemporaryWorkflowService } from '@/modules/temporary-workflow/temporary-workflow.service';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TenantTemporaryWorkflowCleanupCronService {
  constructor(private readonly temporaryWorkflowService: TemporaryWorkflowService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredTemporaryWorkflows() {
    try {
      logger.info('开始清理过期的临时工作流...');
      const cleanedCount = await this.temporaryWorkflowService.cleanupExpiredTemporaryWorkflows();
      logger.info(`清理完成，共清理 ${cleanedCount} 条过期记录`);
    } catch (error) {
      logger.error('清理过期临时工作流失败:', error);
    }
  }
}
