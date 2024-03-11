import { config } from '@/common/config';
import { InMemoryLockManager, RedisLockManager } from '@/common/utils/lock';
import { ToolsModule } from '@/modules/tools/tools.module';
import { Module } from '@nestjs/common';
import { ToolsRegistryCronService } from './services/tools-registry.cron.service';

@Module({
  providers: [
    {
      provide: 'LOCK',
      useFactory: () => {
        return config.redis.enabled ? new RedisLockManager(config.redis.url) : new InMemoryLockManager();
      },
    },
    ToolsRegistryCronService,
  ],
  imports: [ToolsModule],
})
export class CronJobModule {}
