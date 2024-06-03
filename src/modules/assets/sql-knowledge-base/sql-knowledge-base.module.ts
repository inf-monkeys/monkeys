import { ToolsModule } from '@/modules/tools/tools.module';
import { Module } from '@nestjs/common';
import { SqlKnowledgeBaseController } from './sql-knowledge-base.controller';
import { SqlKnowledgeBaseService } from './sql-knowledge-base.service';

@Module({
  controllers: [SqlKnowledgeBaseController],
  providers: [SqlKnowledgeBaseService],
  imports: [ToolsModule],
  exports: [SqlKnowledgeBaseService],
})
export class SqlKnowledgeBaseModule {}
