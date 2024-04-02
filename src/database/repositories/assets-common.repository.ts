import { AssetType, AssetWithAdditionalInfo } from '@/common/typings/asset';
import { getPublicProfile } from '@/common/utils/user';
import { CreateAssetFilterDto } from '@/modules/assets/req/create-asset-filter.dto';
import { UpdateAssetFilterDto } from '@/modules/assets/req/update-asset-filter.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isNil, pickBy, uniq } from 'lodash';
import { ObjectId } from 'mongodb';
import { pinyin } from 'pinyin-pro';
import { DeepPartial, In, MongoRepository } from 'typeorm';
import { AssetFilterEntity } from '../entities/assets/asset-filter';
import { AssetsTagEntity } from '../entities/assets/asset-tag-definitions';
import { AssetsTagRelationsEntity } from '../entities/assets/asset-tags';
import { BaseAssetEntity } from '../entities/assets/base-asset';
import { TeamRepository } from './team.repository';
import { UserRepository } from './user.repository';

export interface AssetsFillAdditionalInfoOptions {
  withUser?: boolean;
  withTeam?: boolean;
  withTags?: boolean;
}

@Injectable()
export class AssetsCommonRepository {
  constructor(
    @InjectRepository(AssetFilterEntity)
    private readonly assetsFilterRepository: MongoRepository<AssetFilterEntity>,
    @InjectRepository(AssetsTagEntity)
    private readonly assetTagRepo: MongoRepository<AssetsTagEntity>,
    @InjectRepository(AssetsTagRelationsEntity)
    private readonly assetsTagRelationsRepo: MongoRepository<AssetsTagRelationsEntity>,
    private readonly userRepository: UserRepository,
    private readonly teamRepository: TeamRepository,
  ) {}

  public async listFilters(teamId: string, assetType: AssetType) {
    const data = await this.assetsFilterRepository.find({
      where: {
        teamId: teamId,
        assetType: assetType,
        isDeleted: false,
      },
    });
    return data;
  }

  public async createAssetFilter(teamId: string, userId: string, body: CreateAssetFilterDto) {
    const { name, type, rules } = body;
    const data: AssetFilterEntity = {
      id: new ObjectId(),
      teamId,
      creatorUserId: userId,
      name,
      assetType: type,
      rules,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
    };
    await this.assetsFilterRepository.save(data);
    return data;
  }

  public async updateAssetFilter(teamId: string, filterId: string, updates: UpdateAssetFilterDto) {
    await this.assetsFilterRepository.update(
      {
        id: new ObjectId(filterId),
        teamId: teamId,
        isDeleted: false,
      },
      {
        ...pickBy(updates, (v) => !isNil(v)),
        updatedTimestamp: Date.now(),
      },
    );
    return await this.assetsFilterRepository.findOne({
      where: {
        id: new ObjectId(filterId),
        teamId: teamId,
        isDeleted: false,
      },
    });
  }

  public async deleteAssetFilter(teamId: string, filterId: string) {
    await this.assetsFilterRepository.updateOne(
      {
        id: new ObjectId(filterId),
        teamId,
        isDeleted: false,
      },
      {
        isDeleted: true,
        updatedTimestamp: Date.now(),
      },
    );

    return true;
  }

  public async listTags(teamId: string) {
    return await this.assetTagRepo.find({
      where: {
        teamId,
        isDeleted: false,
      },
    });
  }

  public async createTag(teamId: string, name: string, color?: string) {
    if (typeof name !== 'string' || !name.trim()) {
      throw new Error('请输入标签名称');
    }
    const exists = await this.assetTagRepo.findOne({
      where: {
        teamId,
        name,
        isDeleted: false,
      },
    });
    if (exists) {
      return exists;
    }
    const entity = {
      id: new ObjectId(),
      isDeleted: false,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      teamId,
      name,
      color,
      _pinyin: pinyin(name, { toneType: 'none' }).replace(/\s/g, ''),
    };
    await this.assetTagRepo.save(entity);
    return entity;
  }

  public async updateTag(
    teamId: string,
    tagId: string,
    updates: {
      name?: string;
      color?: string;
    },
  ) {
    const { name, color } = updates;
    const exists = await this.assetTagRepo.findOne({
      where: {
        teamId,
        id: new ObjectId(tagId),
        isDeleted: false,
      },
    });
    if (!exists) {
      throw new Error('tag 不存在');
    }

    if (updates.name && updates.name !== exists.name) {
      const nameConfilct = await this.assetTagRepo.exists({
        where: {
          teamId,
          name,
          isDeleted: false,
        },
      });
      if (nameConfilct) {
        throw new Error('同名 tag 已存在');
      }
    }

    const toUpdates: DeepPartial<AssetsTagEntity> = {
      updatedTimestamp: Date.now(),
    };
    if (updates.name) {
      toUpdates.name = name;
      toUpdates._pinyin = pinyin(name, { toneType: 'none' }).replace(/\s/g, '');
    }
    if (updates.color) {
      toUpdates.color = color;
    }

    await this.assetTagRepo.updateOne(
      {
        id: new ObjectId(tagId),
      },
      toUpdates,
    );
  }

  public async deleteTag(teamId: string, tagId: string) {
    await this.assetTagRepo.updateOne(
      {
        teamId,
        id: new ObjectId(tagId),
      },
      {
        isDeleted: true,
      },
    );
  }

  public async addTagsToAsset(teamId: string, assetType: AssetType, assetId: string, tagIds: string[]) {
    for (const tagId of tagIds) {
      const exists = await this.assetsTagRelationsRepo.findOne({
        where: {
          assetType,
          assetId,
          tagId,
          isDeleted: false,
        },
      });
      if (!exists) {
        await this.assetsTagRelationsRepo.save({
          id: new ObjectId(),
          isDeleted: false,
          createdTimestamp: Date.now(),
          updatedTimestamp: Date.now(),
          teamId,
          assetType,
          assetId,
          tagId,
        });
      }
    }
  }

  public async removeAssetTags(teamId: string, assetType: AssetType, assetId: string, tagIds: string[]) {
    if (tagIds.length) {
      await this.assetsTagRelationsRepo.update(
        {
          teamId,
          assetType,
          assetId,
        },
        {
          isDeleted: true,
        },
      );
    }
  }

  public async fillAdditionalInfo<E extends BaseAssetEntity>(item: E, options?: AssetsFillAdditionalInfoOptions): Promise<AssetWithAdditionalInfo<E>> {
    const { withTeam = false, withUser = false, withTags = false } = options || {};
    const result: AssetWithAdditionalInfo<E> = {
      ...item,
    };
    if (!item) return null;
    const { teamId, creatorUserId } = item as E;

    if (withUser) {
      if (creatorUserId) {
        const user = await this.userRepository.findById(creatorUserId);
        if (user) {
          const userProfile = getPublicProfile(user);
          result.user = userProfile;
        } else {
          result.user = {};
        }
      } else {
        result.user = {};
      }
    }

    if (withTeam) {
      const teamProfile = await this.teamRepository.getTeamById(teamId);
      result.team = teamProfile;
    }

    if (withTags) {
      const tagIds = (
        await this.assetsTagRelationsRepo.find({
          where: {
            assetType: item.assetType,
            assetId: item.getAssetId(),
            isDeleted: false,
          },
        })
      ).map((x) => x.tagId);
      result.assetTags = await this.assetTagRepo.find({
        where: {
          id: In(tagIds.map((x) => new ObjectId(x))),
        },
      });
    }

    return result;
  }

  public async fillAdditionalInfoList<E extends BaseAssetEntity>(list: E[], options?: AssetsFillAdditionalInfoOptions): Promise<AssetWithAdditionalInfo<E>[]> {
    const { withTeam = false, withUser = false, withTags = false } = options || {};

    const teamIds = uniq((list as E[]).map((l) => l.teamId).filter((l) => l));
    const userIds = uniq((list as E[]).map((l) => l.creatorUserId).filter((l) => l));
    const assetIds = uniq(list.map((l) => l.getAssetId()).flat());

    const assetIdToTags: { [x: string]: AssetsTagEntity[] } = {};

    if (withTags) {
      const allTagRels =
        withTags && assetIds.length
          ? await this.assetsTagRelationsRepo.find({
              where: list.map((x) => ({
                assetType: x.assetType,
                assetId: x.getAssetId(),
                isDeleted: false,
              })),
            })
          : [];
      const allTagIds = uniq(allTagRels.map((x) => x.tagId));
      const allTagDefs =
        withTags && allTagIds.length
          ? await this.assetTagRepo.find({
              where: {
                id: In(allTagIds.map((x) => new ObjectId(x))),
              },
            })
          : [];
      for (const item of list) {
        const itemTagIds = allTagRels.filter((x) => x.assetId === item.getAssetId()).map((x) => x.tagId);
        assetIdToTags[item.getAssetId()] = allTagDefs.filter((x) => itemTagIds.includes(x.id.toHexString()));
      }
    }

    const teamHash = withTeam ? await this.teamRepository.getTeamsByIdsAsMap(teamIds) : null;
    const userHash = withTeam ? await this.userRepository.getUsersByIdsAsMap(userIds) : null;

    const result: Array<AssetWithAdditionalInfo<E>> = [];
    for (const originalItem of list) {
      const item: AssetWithAdditionalInfo<E> = {
        ...originalItem,
      };
      if (withUser) {
        item.user = userHash?.[originalItem.creatorUserId] ? getPublicProfile(userHash?.[originalItem.creatorUserId]) : {};
      }
      if (withTeam) {
        item.team = teamHash?.[originalItem.teamId] ?? {};
      }
      if (withTags) {
        item.assetTags = assetIdToTags[originalItem.getAssetId()];
      }
      result.push(item);
    }
    return result;
  }
}
