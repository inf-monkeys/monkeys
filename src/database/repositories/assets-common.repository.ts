import { AssetType } from '@/common/typings/asset';
import { CreateAssetFilterDto } from '@/modules/assets/req/create-asset-filter.dto';
import { UpdateAssetFilterDto } from '@/modules/assets/req/update-asset-filter.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isNil, pickBy } from 'lodash';
import { ObjectId } from 'mongodb';
import { MongoRepository } from 'typeorm';
import { AssetFilterEntity } from '../entities/assets/asset-filter';
import { AssetsTagEntity } from '../entities/assets/asset-tags';

@Injectable()
export class AssetsCommonRepository {
  constructor(
    @InjectRepository(AssetFilterEntity)
    private readonly assetsFilterRepository: MongoRepository<AssetFilterEntity>,
    @InjectRepository(AssetsTagEntity)
    private readonly assetPublicCategoryRepo: MongoRepository<AssetsTagEntity>,
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
}
