import { Module } from '@nestjs/common';
import { KnowledgeBaseSqlController } from './knowledge-base-sql.controller';
import { KnowledgeBaseSqlService } from './knowledge-base-sql.service';

@Module({
  controllers: [KnowledgeBaseSqlController],
  providers: [KnowledgeBaseSqlService]
})
export class KnowledgeBaseSqlModule {}
