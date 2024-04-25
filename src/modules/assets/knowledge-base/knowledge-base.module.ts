import { ToolsModule } from '@/modules/tools/tools.module';
import { Module } from '@nestjs/common';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { KnowledgeBaseService } from './knowledge-base.service';

@Module({
  controllers: [KnowledgeBaseController],
  providers: [KnowledgeBaseService],
  imports: [ToolsModule],
  exports: [KnowledgeBaseService],
})
export class KnowledgeBaseModule {}
