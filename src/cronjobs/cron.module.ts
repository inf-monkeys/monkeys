import { config } from '@/common/config';
import { InMemoryLockManager, RedisLockManager } from '@/common/utils/lock';
import { ToolsModule } from '@/modules/tools/tools.module';
import { WorkflowModule } from '@/modules/workflow/workflow.module';
import { Module } from '@nestjs/common';
import { ToolsRegistryCronService } from './services/tools-registry.cron.service';
import { WorkflowCronService } from './services/workflow.cron.service';

@Module({
  providers: [
    {
      provide: 'LOCK',
      useFactory: () => {
        return config.redis.url ? new RedisLockManager(config.redis.url) : new InMemoryLockManager();
      },
    },
    ToolsRegistryCronService,
    WorkflowCronService,
  ],
  imports: [ToolsModule, WorkflowModule],
})
export class CronJobModule {}
