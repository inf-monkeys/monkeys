import { AssetType } from '@inf-monkeys/monkeys';
import { ForbiddenException, Inject, Injectable, forwardRef } from '@nestjs/common';

import { BaseAssetEntity } from '@/database/entities/assets/base-asset';
import { MarketplaceService } from '../marketplace/services/marketplace.service';

/**
 * 统一的资产权限服务（第一阶段：主要支持 workflow 的内置应用只读控制）
 *
 * 后续可以在此基础上扩展：
 * - 支持 AssetsAuthorizationEntity（按团队/用户授权）
 * - 支持更多 assetType（comfyui、knowledge-base 等）
 */
@Injectable()
export class AssetsPermissionService {
  constructor(
    @Inject(forwardRef(() => MarketplaceService))
    private readonly marketplaceService: MarketplaceService,
  ) {}

  /**
   * 校验某资产在当前团队下是否允许「写」（更新 / 删除 / 克隆 / 回滚）
   *
   * 目前仅对 workflow 类型做特殊控制：
   * - 若 workflow 绑定到预置应用（app.isPreset = true）
   * - 且当前 teamId 不是该应用的 authorTeamId
   * - 则视为「内置应用映射实例」，统一禁止写入
   */
  public async assertCanWriteAsset(teamId: string, asset: BaseAssetEntity & { assetType: AssetType; getAssetId(): string }) {
    if (!asset) return;

    // 仅对 workflow 资产做内置应用只读控制，其他资产暂不限制
    if (asset.assetType !== 'workflow') {
      return;
    }

    // 资产所属团队不是当前团队，直接禁止写
    if (asset.teamId && asset.teamId !== teamId) {
      throw new ForbiddenException('无权限操作其他团队的资产');
    }

    const workflowId = asset.getAssetId();

    // 1. 尝试通过 sourceAssetReferences 查找作者团队中的「源 workflow」对应的预置应用
    let appVersion = await this.marketplaceService.getAppVersionByAssetId(workflowId, 'workflow');

    // 2. 如果查不到，说明当前 workflow 可能是安装到其他团队的「映射实例」
    //    通过 InstalledAppEntity.installedAssetIds 反查其所属的预置应用版本
    if (!appVersion) {
      const installed = await this.marketplaceService.getInstalledAppVersionIdByAssetId(workflowId, 'workflow');
      if (installed?.marketplaceAppVersionId) {
        appVersion = await this.marketplaceService.getAppVersionById(installed.marketplaceAppVersionId);
      }
    }

    const app = appVersion?.app;
    if (!app || !app.isPreset) {
      // 非预置应用对应的 workflow，不做额外限制
      return;
    }

    // 预置应用：只有作者团队可以写，其余团队（映射实例）一律只读
    if (app.authorTeamId !== teamId) {
      throw new ForbiddenException('内置应用映射仅可读，只有设置为内置应用的团队可以修改工作流');
    }
  }
}


