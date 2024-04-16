import { AssetFilter, ListDto } from '@/common/dto/list.dto';
import { AssetType } from '@/common/typings/asset';
import { Between, FindOptionsOrder, FindOptionsWhere, In, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { AssetPublishConfig, AssetPublishPolicy, BaseAssetEntity } from '../entities/assets/base-asset';
import { AssetsCommonRepository, AssetsFillAdditionalInfoOptions } from './assets-common.repository';

export class AbstractAssetRepository<E extends BaseAssetEntity> {
  constructor(
    public readonly repository: Repository<E>,
    public readonly assetCommonRepository: AssetsCommonRepository,
  ) {}

  public async findAssetIdsByCommonFilter(assetType: AssetType, filter: AssetFilter, assetIdField: string = 'id') {
    const condition: FindOptionsWhere<BaseAssetEntity> = {};
    if (filter.createdTimestamp) {
      const [startCreatedTimestamp, endCreatedTimestamp] = filter.createdTimestamp;
      if (startCreatedTimestamp && endCreatedTimestamp) {
        condition.createdTimestamp = Between(Number(startCreatedTimestamp), Number(endCreatedTimestamp));
      } else if (startCreatedTimestamp) {
        condition.createdTimestamp = MoreThanOrEqual(Number(startCreatedTimestamp));
      } else if (endCreatedTimestamp) {
        condition.createdTimestamp = LessThanOrEqual(Number(endCreatedTimestamp));
      }
    }
    if (filter.updatedTimestamp) {
      const [startUpdatedTimestamp, endUpdatedTimestamp] = filter.updatedTimestamp;
      if (startUpdatedTimestamp && endUpdatedTimestamp) {
        condition.updatedTimestamp = Between(Number(startUpdatedTimestamp), Number(endUpdatedTimestamp));
      } else if (startUpdatedTimestamp) {
        condition.updatedTimestamp = MoreThanOrEqual(Number(startUpdatedTimestamp));
      } else if (endUpdatedTimestamp) {
        condition.updatedTimestamp = LessThanOrEqual(Number(endUpdatedTimestamp));
      }
    }
    if (filter.tagIds?.length) {
      const assetIds = await this.assetCommonRepository.findAssetIdsByTagIds(assetType, filter.tagIds);
      if (assetIds.length) {
        condition[assetIdField] = In(assetIds);
      }
    }
    if (filter.userIds?.length) {
      condition.creatorUserId = In(filter.userIds);
    }
    const assets = await this.repository.find({
      where: condition as unknown as FindOptionsWhere<E>,
    });
    return assets.map((x) => x.getAssetId());
  }

  public async getAssetById(id: string, additionQuery: Record<string, any> = {}, options?: AssetsFillAdditionalInfoOptions): Promise<E | undefined> {
    const entity = await this.repository.findOne({
      where: {
        isDeleted: false,
        id: id,
        ...additionQuery,
      } as Partial<E> as FindOptionsWhere<E>,
    });
    return await this.assetCommonRepository.fillAdditionalInfo(entity, options);
  }

  public async listAssets(
    assetType: AssetType,
    teamId: string,
    dto: ListDto,
    options?: AssetsFillAdditionalInfoOptions,
  ): Promise<{
    list: E[];
    totalCount: number;
  }> {
    const [DEFAULT_PAGE, DEFAULT_LIMIT] = [1, 24];
    const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, filter, orderBy = 'DESC', orderColumn = 'createdTimestamp' } = dto ?? {};
    const authorizedIds = await this.assetCommonRepository.listAuthorizedAssetIds(teamId, assetType);
    let idsConstraints = [];
    if (filter) {
      idsConstraints = await this.findAssetIdsByCommonFilter(assetType, filter);
      if (!idsConstraints.length) {
        return {
          totalCount: 0,
          list: [],
        };
      }
    }

    const list = await this.repository.find({
      where: [
        {
          teamId,
          isDeleted: false,
          id: idsConstraints.length ? In(idsConstraints) : undefined,
        },
        {
          id: In(authorizedIds),
          isDeleted: false,
        },
      ] as FindOptionsWhere<E>[],
      order: {
        [orderColumn]: orderBy,
      } as FindOptionsOrder<E>,
      take: +limit,
      skip: (+page - 1) * +limit,
    });
    const totalCount = await this.repository.count({
      where: [
        {
          teamId,
          isDeleted: false,
        },
        {
          id: In(authorizedIds),
          isDeleted: false,
        },
      ] as FindOptionsWhere<E>[],
      order: {
        createdTimestamp: -1,
      } as FindOptionsOrder<E>,
      take: +limit,
      skip: (+page - 1) * +limit,
    });

    return {
      list: await this.assetCommonRepository.fillAdditionalInfoList(list, options),
      totalCount,
    };
  }

  public async publishAsset(teamId: string, assetId: string, publishConfig: AssetPublishConfig) {
    const asset = await this.getAssetById(assetId);
    if (!asset) {
      throw new Error('资产不存在');
    }
    if (asset.teamId !== teamId) {
      throw new Error('无权限操作此资产');
    }
    const isPreset = asset.isPreset;
    if (isPreset) {
      throw new Error('无法发布预置资产');
    }
    asset.isPublished = true;
    asset.publishConfig = publishConfig;
    await this.repository.save(asset);
    return true;
  }

  public async forkAsset(teamId: string, assetId: string) {
    const asset = await this.getAssetById(assetId);
    if (!asset) {
      throw new Error('资产不存在');
    }
    const { isPublished, publishConfig } = asset;
    if (!isPublished) {
      throw new Error('此资产未发布');
    }
    if (asset.teamId === teamId) {
      throw new Error('此资产由此团队发布，不能克隆');
    }
    const { policy } = publishConfig;
    switch (policy) {
      case AssetPublishPolicy.authorize:
        break;
      case AssetPublishPolicy.clone:
        break;
      case AssetPublishPolicy.createNew:
        break;
      default:
        break;
    }
  }
}
