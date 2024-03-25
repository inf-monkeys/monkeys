import { ListDto } from '@/common/dto/list.dto';
import { AssetWithIdentity, ConvertListDtoToDbQueryOptions } from '@/common/typings/asset';
import { IRequest } from '@/common/typings/request';
import { getPublicProfile } from '@/common/utils/user';
import { ForbiddenException } from '@nestjs/common';
import { uniq } from 'lodash';
import { ObjectId } from 'mongodb';
import { FindManyOptions, FindOptionsOrder, FindOptionsWhere, Repository } from 'typeorm';
import { BaseAssetEntity } from '../entities/assets/base-asset';
import { TeamRepository } from './team.repository';
import { UserRepository } from './user.repository';

export class AbstractAssetRepository<E extends BaseAssetEntity> {
  constructor(
    private readonly repository: Repository<E>,
    private readonly userRepository: UserRepository,
    private readonly teamRepository: TeamRepository,
  ) {}

  private async _withIdentity(item: E): Promise<AssetWithIdentity<E>> {
    if (!item) return null;
    const { teamId, creatorUserId } = item as BaseAssetEntity;
    let userProfile = {};
    if (creatorUserId) {
      const user = await this.userRepository.findById(creatorUserId);
      userProfile = getPublicProfile(user);
    }
    const teamProfile = await this.teamRepository.getTeamById(teamId);

    return {
      ...item,
      user: userProfile || {},
      team: teamProfile || {},
    };
  }

  private async _withIdentities(list: E[]): Promise<AssetWithIdentity<E>[]> {
    const teamIds = uniq((list as E[]).map((l) => l.teamId).filter((l) => l));
    const userIds = uniq((list as E[]).map((l) => l.creatorUserId).filter((l) => l));
    const usersMap = await this.userRepository.getUsersByIdsAsMap(userIds);
    const teamHash = await this.teamRepository.getTeamsByIdsAsMap(teamIds);

    return list.map<AssetWithIdentity<E>>((item) => ({
      ...item,
      user: usersMap?.[item.creatorUserId] ? getPublicProfile(usersMap?.[item.creatorUserId]) : {},
      team: teamHash?.[item.teamId] ?? {},
    }));
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

  public async findById(id: string, additionQuery: Record<string, any> = {}, withIdentity = true): Promise<E | undefined> {
    const entity = await this.repository.findOne({
      where: {
        isDeleted: false,
        id: new ObjectId(id),
        ...additionQuery,
      } as Partial<E> as FindOptionsWhere<E>,
    });
    if (withIdentity) {
      const dataWithIdentity = await this._withIdentity(entity);
      return dataWithIdentity;
    }
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
      return { data: await this._withIdentities(data), total, page: +page, limit: +limit };
    }
    return { data, total, page: +page, limit: +limit };
  }
}
