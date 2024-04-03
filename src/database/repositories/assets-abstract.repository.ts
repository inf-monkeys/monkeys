import { AssetFilter, ListDto } from '@/common/dto/list.dto';
import { AssetType, ConvertListDtoToDbQueryOptions } from '@/common/typings/asset';
import { IRequest } from '@/common/typings/request';
import { ForbiddenException } from '@nestjs/common';
import { Between, FindManyOptions, FindOptionsOrder, FindOptionsWhere, In, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
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

  public _buildDbQuery(dto: ListDto, options: ConvertListDtoToDbQueryOptions = {}, request?: IRequest): FindManyOptions<E> {
    const { filter = {}, orderBy = 'DESC', orderColumn = 'createdTimestamp', page = 1, limit = 24 } = dto;
    const { mixinOrQuery = [], searchColumns = [], mixInQuery = {} } = options;
    const { teamId, isAdmin } = request || {};

    // 构建筛选
    let where = {
      ...mixInQuery,
      isDeleted: false,
    } as Partial<E> as FindOptionsWhere<E>;
    if (mixinOrQuery.length === 0 && teamId && !isAdmin) {
      (where as any).teamId = teamId;
    }
    if (filter.userIds?.length) {
      (where as any).creatorUserId = {
        $in: filter.userIds,
      };
    }
    if (dto.search?.trim() && searchColumns.length > 0) {
      (where as any).$or ??= [];
      (where as any).$or.push({
        $or: searchColumns.map((s) => ({ [s]: { $regex: `.*${dto.search}.*` } })),
      });
    }
    if (filter?.createdTimestamp) {
      const [start, end] = filter.createdTimestamp.map((n) => Number(n));
      if (start && end) {
        where.createdTimestamp = { $gte: start, $lte: end } as any;
      } else if (start) {
        where.createdTimestamp = { $gte: start } as any;
      } else if (end) {
        where.createdTimestamp = { $lte: end } as any;
      }
    }
    if (filter?.updatedTimestamp) {
      const [start, end] = filter.updatedTimestamp.map((n) => Number(n));
      if (start && end) {
        where.updatedTimestamp = { $gte: start, $lte: end } as any;
      } else if (start) {
        where.updatedTimestamp = { $gte: start } as any;
      } else if (end) {
        where.updatedTimestamp = { $lte: end } as any;
      }
    }
    // if (filter?.tagIds && filter.tagIds.length > 0) {
    //   where.assetTags = {
    //     $all: uniq(filter.tagIds),
    //   } as any;
    // }
    // if (filter?.categoryIds && filter.categoryIds.length > 0) {
    //   (where as any).publicAssetCategoryIds = {
    //     $all: uniq(filter.categoryIds),
    //   };
    // }
    // if (filter?.ids && filter.ids.length > 0) {
    //   where._id = {
    //     $in: uniq(filter.ids).map((id: string) => new ObjectId(id)),
    //   } as any;
    // }
    if (mixinOrQuery.length > 0) {
      const { $or = [], ...rest } = where as any;
      const or: any[] = $or;
      (where as any) = {
        $or: mixinOrQuery.map((o) => {
          let query = { ...o, ...rest };
          or.forEach((q) => {
            query = { ...query, ...q };
          });
          return query;
        }),
      };
    }

    // 构建排序
    const order = { [orderColumn]: orderBy } as FindOptionsOrder<E>;

    // 构建查询
    const condition: FindManyOptions<E> | Partial<E> = {
      where,
      order,
      // 构建分页
      skip: (+page - 1) * +limit,
      take: +limit,
    };

    return condition as unknown as FindManyOptions<E>;
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

  public async listAssets(dto: ListDto, request: IRequest | null = null, withIdentity = true, options: ConvertListDtoToDbQueryOptions = {}) {
    if (request !== null) {
      const { teamId, userId, isAdmin } = request ?? {};
      if (!teamId && !userId && !isAdmin) {
        throw new ForbiddenException('You are not allowed to access these assets');
      }
    }
    const [DEFAULT_PAGE, DEFAULT_LIMIT] = [1, 24];
    const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = dto ?? {};
    options.mixInQuery ??= { isPresetAsset: { $ne: true }, isPublicAsset: { $ne: true } };
    options.searchColumns ??= ['name', 'description'];
    const query = this._buildDbQuery(
      dto,
      {
        ...options,
        mixInQuery: {
          isPublicAsset: {
            $ne: true,
          },
          isPresetAsset: {
            $ne: true,
          },
          ...options.mixInQuery,
        },
      },
      request,
    );
    const [data, total] = await this.repository.findAndCount(query);
    if (withIdentity) {
      return { data: await this.assetCommonRepository.fillAdditionalInfoList(data), total, page: +page, limit: +limit };
    }
    return { data, total, page: +page, limit: +limit };
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
