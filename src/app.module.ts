import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './modules/infra/database/database.module';
import { RepositoryMoule } from './modules/infra/database/repositories/repositories.module';
import { ToolsModule } from './modules/tools/tools.module';
import { WorkflowModule } from './modules/workflow/workflow.module';

@Module({
  imports: [DatabaseModule, ToolsModule, RepositoryMoule, WorkflowModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
