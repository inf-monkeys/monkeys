import { ComfyuiWorkflowEntity } from '@/database/entities/comfyui/comfyui-workflow.entity';
import { AssetCloneResult, AssetUpdateResult, IAssetHandler } from '@/modules/marketplace/types';
import { Injectable } from '@nestjs/common';
import { ComfyUIService } from './comfyui.service';

@Injectable()
export class ComfyuiWorkflowCrudService implements IAssetHandler {
  constructor(private readonly comfyuiService: ComfyUIService) {}

  /**
   * 获取设计关联的快照
   */
  public async getSnapshot(comfyuiWorkflowId: string): Promise<any> {
    const workflow = await this.comfyuiService.getComfyuiWorkflowById(comfyuiWorkflowId);

    return {
      ...workflow,
      teamId: undefined,
    };
  }

  /**
   * 从快照中克隆设计关联
   * 需要将市场中的 app id 映射为团队内的实际设计 id
   */
  public async cloneFromSnapshot(snapshot: ComfyuiWorkflowEntity, teamId: string, userId: string): Promise<AssetCloneResult> {
    const newWorkflow = await this.comfyuiService.createComfyuiWorkflow(teamId, userId, snapshot);

    // 返回第一个关联的ID作为主要ID
    return {
      originalId: snapshot.id,
      newId: newWorkflow.id,
    };
  }

  public async updateFromSnapshot(snapshot: ComfyuiWorkflowEntity, teamId: string, userId: string, assetId: string): Promise<AssetUpdateResult> {
    await this.comfyuiService.updateComfyuiWorkflow(assetId, { ...snapshot });

    return {
      originalId: snapshot.id,
    };
  }

  /**
   * 重新映射设计关联的依赖关系
   */
  public async remapDependencies(): Promise<void> {
    return;
  }
}
