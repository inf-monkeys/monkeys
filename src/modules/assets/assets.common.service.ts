import { BaseAssetEntity } from '@/database/entities/assets/base-asset';
import { AbstractAssetRepository } from '@/database/repositories/assets-abstract.repository';
import { CanvasAssetRepositroy } from '@/database/repositories/assets-canvas.repository';
import { ComfyuiWorkflowAssetRepositroy } from '@/database/repositories/assets-comfyui-workflow.respository';
import { ConversationAppAssetRepositroy } from '@/database/repositories/assets-conversation-app.repository';
import { SqlKnowledgeBaseAssetRepositroy } from '@/database/repositories/assets-knowledge-base-sql.repository';
import { KnowledgeBaseAssetRepositroy } from '@/database/repositories/assets-knowledge-base.repository';
import { LlmChannelAssetRepositroy } from '@/database/repositories/assets-llm-channel.respository';
import { LlmModelAssetRepositroy } from '@/database/repositories/assets-llm-model.respository';
import { MediaFileAssetRepositroy } from '@/database/repositories/assets-media-file.repository';
import { SdModelAssetRepositroy } from '@/database/repositories/assets-sd-model.repository';
import { WorkflowAssetRepositroy } from '@/database/repositories/assets-workflow.respository';
import { AssetType } from '@inf-monkeys/monkeys';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AssetsMapperService {
  constructor(
    private readonly canvasAssetsRepository: CanvasAssetRepositroy,
    private readonly llmModelAssetsRepository: LlmModelAssetRepositroy,
    private readonly sdModelAssetsRepository: SdModelAssetRepositroy,
    private readonly knowledgeBaseRepository: KnowledgeBaseAssetRepositroy,
    private readonly mediaFileAssetsRepository: MediaFileAssetRepositroy,
    private readonly workflowAssetRepositroy: WorkflowAssetRepositroy,
    private readonly sqlKnowledgeBaseRepository: SqlKnowledgeBaseAssetRepositroy,
    private readonly comfyuiWorkflowAssetsRepository: ComfyuiWorkflowAssetRepositroy,
    private readonly llmChannelAssetRepository: LlmChannelAssetRepositroy,
    private readonly conversationAppAssetRepository: ConversationAppAssetRepositroy,
  ) {}

  public getRepositoryByAssetType(assetType: AssetType): AbstractAssetRepository<BaseAssetEntity> {
    if (assetType === 'canvas') {
      return this.canvasAssetsRepository as AbstractAssetRepository<BaseAssetEntity>;
    } else if (assetType === 'llm-model') {
      return this.llmModelAssetsRepository as AbstractAssetRepository<BaseAssetEntity>;
    } else if (assetType === 'sd-model') {
      return this.sdModelAssetsRepository as AbstractAssetRepository<BaseAssetEntity>;
    } else if (assetType === 'knowledge-base') {
      return this.knowledgeBaseRepository as AbstractAssetRepository<BaseAssetEntity>;
    } else if (assetType === 'media-file') {
      return this.mediaFileAssetsRepository as AbstractAssetRepository<BaseAssetEntity>;
    } else if (assetType === 'workflow') {
      return this.workflowAssetRepositroy as AbstractAssetRepository<BaseAssetEntity>;
    } else if (assetType === 'sql-knowledge-base') {
      return this.sqlKnowledgeBaseRepository as AbstractAssetRepository<BaseAssetEntity>;
    } else if (assetType === 'comfyui-workflow') {
      return this.comfyuiWorkflowAssetsRepository as AbstractAssetRepository<BaseAssetEntity>;
    } else if (assetType === 'llm-channel') {
      return this.llmChannelAssetRepository as AbstractAssetRepository<BaseAssetEntity>;
    } else if (assetType === 'conversation-app') {
      return this.conversationAppAssetRepository as AbstractAssetRepository<BaseAssetEntity>;
    } else {
      throw new Error('invalid assetType');
    }
  }
}
