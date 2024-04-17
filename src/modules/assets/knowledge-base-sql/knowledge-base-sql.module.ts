import { ToolsModule } from '@/modules/tools/tools.module';
import { Module } from '@nestjs/common';
import { SqlKnowledgeBaseController } from './knowledge-base-sql.controller';
import { SqlKnowledgeBaseService } from './knowledge-base-sql.service';

@Module({
  controllers: [SqlKnowledgeBaseController],
  providers: [SqlKnowledgeBaseService],
  imports: [ToolsModule],
})
export class KnowledgeBaseSqlModule {}
