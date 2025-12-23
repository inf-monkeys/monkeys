import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowMetadataEntity } from '@/database/entities/workflow/workflow-metadata';
import { WorkflowBatchEditorController } from './workflow-batch-editor.controller';
import { WorkflowBatchEditorService } from './workflow-batch-editor.service';
import { WorkflowSearchService } from './workflow-search.service';
import { ParameterUpdaterService } from './parameter-updater.service';
import { AiParserService } from './ai-parser.service';
import { WorkflowModule } from '../workflow/workflow.module';
import { ToolsModule } from '../tools/tools.module';

/**
 * 工作流批量编辑模块
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([WorkflowMetadataEntity]),
    WorkflowModule,
    ToolsModule,
  ],
  controllers: [WorkflowBatchEditorController],
  providers: [
    WorkflowBatchEditorService,
    WorkflowSearchService,
    ParameterUpdaterService,
    AiParserService,
  ],
  exports: [
    WorkflowBatchEditorService,
    WorkflowSearchService,
  ],
})
export class WorkflowBatchEditorModule {}
