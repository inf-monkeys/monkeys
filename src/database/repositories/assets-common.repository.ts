import { AssetType } from '@/common/typings/asset';
import { CreateAssetFilterDto } from '@/modules/assets/req/create-asset-filter.dto';
import { UpdateAssetFilterDto } from '@/modules/assets/req/update-asset-filter.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isNil, pickBy } from 'lodash';
import { ObjectId } from 'mongodb';
import { pinyin } from 'pinyin-pro';
import { DeepPartial, MongoRepository } from 'typeorm';
import { AssetFilterEntity } from '../entities/assets/asset-filter';
import { AssetsTagEntity } from '../entities/assets/asset-tags';

@Injectable()
export class AssetsCommonRepository {
  constructor(
    @InjectRepository(AssetFilterEntity)
    private readonly assetsFilterRepository: MongoRepository<AssetFilterEntity>,
    @InjectRepository(AssetsTagEntity)
    private readonly assetTagRepo: MongoRepository<AssetsTagEntity>,
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

  public async createTag(teamId: string, name: string, color: string) {
    const exists = await this.assetTagRepo.findOne({
      where: {
        teamId,
        name,
        isDeleted: false,
      },
    });
    if (exists) {
      throw new Error('同名 tag 已存在');
    }
    await this.assetTagRepo.save({
      id: new ObjectId(),
      isDeleted: false,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      teamId,
      name,
      color,
      _pinyin: pinyin(name, { toneType: 'none' }).replace(/\s/g, ''),
    });
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
}
