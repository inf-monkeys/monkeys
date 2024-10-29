import { AssetFilter, ListDto } from '@/common/dto/list.dto';
import { generateDbId } from '@/common/utils';
import { AssetType } from '@inf-monkeys/monkeys';
import _ from 'lodash';
import { Between, FindManyOptions, FindOptionsOrder, FindOptionsWhere, In, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { AssetPublishConfig, BaseAssetEntity } from '../entities/assets/base-asset';
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
    if (filter.marketPlaceTagIds?.length) {
      const assetIds = await this.assetCommonRepository.findAssetIdsByMarketplaceTagIds(assetType, filter.marketPlaceTagIds);
      if (assetIds.length) condition[assetIdField] = In(assetIds);
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
        isPublished: false,
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
    findOptions?: FindManyOptions<E>,
    extraWhere?: FindOptionsWhere<E>,
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

    let list = await this.repository.find({
      where: [
        {
          teamId,
          isDeleted: false,
          isPublished: false,
          id: idsConstraints.length ? In(idsConstraints) : undefined,
          ...extraWhere,
        },
        {
          id: In(authorizedIds),
          isDeleted: false,
          isPublished: false,
          ...extraWhere,
        },
      ] as FindOptionsWhere<E>[],
      order: {
        [orderColumn]: orderBy,
      } as FindOptionsOrder<E>,
      take: +limit,
      skip: (+page - 1) * +limit,
      ...findOptions,
    });
    const totalCount = await this.repository.count({
      where: [
        {
          teamId,
          isDeleted: false,
          isPublished: false,
        },
        {
          id: In(authorizedIds),
          isDeleted: false,
          isPublished: false,
        },
      ] as FindOptionsWhere<E>[],
      order: {
        createdTimestamp: -1,
      } as FindOptionsOrder<E>,
      take: +limit,
      skip: (+page - 1) * +limit,
    });

    list = await this.assetCommonRepository.fillAdditionalInfoList(list, options);
    return {
      list,
      totalCount,
    };
  }

  public async listPublishedAssets(
    assetType: AssetType,
    dto: ListDto,
    options?: AssetsFillAdditionalInfoOptions,
  ): Promise<{
    list: E[];
    totalCount: number;
  }> {
    const [DEFAULT_PAGE, DEFAULT_LIMIT] = [1, 24];
    const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, filter, orderBy = 'DESC', orderColumn = 'createdTimestamp' } = dto ?? {};
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
          isDeleted: false,
          id: idsConstraints.length ? In(idsConstraints) : undefined,
          isPublished: true,
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
          isDeleted: false,
          id: idsConstraints.length ? In(idsConstraints) : undefined,
          isPublished: true,
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

  public async publishAsset(teamId: string, assetId: string, publishConfig: AssetPublishConfig, metadata?: E) {
    const asset = metadata || (await this.getAssetById(assetId));
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
    const extraAssetData = _.pick(publishConfig, 'extraAssetData');
    const id = generateDbId();
    const clonedAsset = this.repository.create({
      ...asset,
      ...extraAssetData,
      workflowId: asset.assetType === 'workflow' ? id : undefined,
      id,
      teamId,
      forkedFrom: assetId,
      isDeleted: false,
      isPreset: false,
      isPublished: true,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      publishConfig: _.omit(publishConfig, 'extraAssetData'),
    });
    await this.repository.save(clonedAsset);
    return clonedAsset;
  }

  public async forkAsset(teamId: string, assetId: string, metadata?: E) {
    const asset =
      metadata ||
      (await this.getAssetById(assetId, {
        isPublished: true,
      }));
    if (!asset) {
      throw new Error('资产不存在');
    }
    if (!asset.isPublished) {
      throw new Error('此资产未发布');
    }
    if (asset.teamId === teamId) {
      throw new Error('此资产由此团队发布，不能克隆');
    }
    const clonedAsset = this.repository.create({
      ...asset,
      id: generateDbId(),
      teamId,
      forkedFrom: assetId,
      isDeleted: false,
      isPreset: false,
      isPublished: false,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
    });
    await this.repository.save(clonedAsset);
    return clonedAsset;
    // const { policy = AssetPublishPolicy.clone } = publishConfig || {};
    // switch (policy) {
    //   case AssetPublishPolicy.authorize:
    //     break;
    //   case AssetPublishPolicy.clone:
    //     break;
    //   case AssetPublishPolicy.createNew:
    //     break;
    //   default:
    //     break;
    // }
  }

  public async updatePublishedAsset(teamId: string, assetId: string, newAssetData: BaseAssetEntity) {
    const asset = await this.getAssetById(assetId, {
      isPublished: true,
    });
    if (!asset) {
      throw new Error('资产不存在');
    }
    if (asset.teamId != teamId) {
      throw new Error('无权限操作此资产');
    }
    const { isPublished } = asset;
    if (!isPublished) {
      throw new Error('此资产未发布');
    }
    const newAsset = {
      ...asset,
      ..._.omit(newAssetData, ['assetType', 'teamId', 'creatorUserId', 'isPreset', 'isPublished', 'id', 'createdTimestamp', 'updatedTimestamp', 'isDeleted']),
      updatedTimestamp: Date.now(),
    };
    await this.repository.save(newAsset);
    return newAsset;
  }

  public async deletePublishedAsset(teamId: string, assetId: string, soft = true) {
    const asset = await this.getAssetById(assetId, {
      isPublished: true,
    });
    if (!asset) {
      throw new Error('资产不存在');
    }
    if (asset.teamId != teamId) {
      throw new Error('无权限操作此资产');
    }
    if (!asset.isPublished) {
      throw new Error('此资产未发布');
    }
    if (soft) {
      asset.isDeleted = true;
      await this.repository.save(asset);
    } else {
      await this.repository.remove(asset);
    }
    return true;
  }

  public async initBuiltInMarketPlace(assetType: AssetType, data: Partial<E>) {
    if (!data.id) {
      throw new Error('id is required to init built-in asset');
    }
    if (!data.displayName) {
      throw new Error('displayName is required to init built-in asset');
    }
    const asset = this.repository.create(data as E);
    asset.isPreset = data.isPreset || false;
    asset.isPublished = true;
    asset.assetType = assetType;
    await this.repository.save(asset);
    return asset;
  }

  public async forkBuiltInWorkflowAssetsFromMarketPlace(teamId: string, creatorUserId: string, extraDataFunc?: (e: E) => { [x: string]: any }) {
    const presetAssets = await this.repository.find({
      where: {
        isPreset: true,
      } as FindOptionsWhere<E>,
    });

    const clonedAssets: E[] = [];
    for (const asset of presetAssets) {
      const { id } = asset;
      const extraData = extraDataFunc ? extraDataFunc(asset) : {};
      const clonedAsset = this.repository.create({
        ...asset,
        ...extraData,
        id: generateDbId(),
        teamId,
        creatorUserId,
        forkFromId: id,
        isDeleted: false,
        isPreset: false,
        isPublished: false,
        createdTimestamp: Date.now(),
        updatedTimestamp: Date.now(),
      });
      await this.repository.save(clonedAsset);
      clonedAssets.push(clonedAsset);
    }
    return clonedAssets;
  }
}
