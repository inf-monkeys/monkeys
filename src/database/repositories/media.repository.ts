import { ListDto } from '@/common/dto/list.dto';
import { S3Helpers } from '@/common/s3';
import { generateDbId } from '@/common/utils';
import { MediaSource } from '@/database/entities/assets/media/media-file';
import { CreateRichMediaDto } from '@/modules/assets/media/dto/req/create-rich-media.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Not, Repository } from 'typeorm';
import { MediaFileEntity } from '../entities/assets/media/media-file';
import { MediaFileAssetRepositroy } from './assets-media-file.repository';

@Injectable()
export class MediaFileRepository {
  constructor(
    @InjectRepository(MediaFileEntity)
    private readonly mediaFileRepository: Repository<MediaFileEntity>,
    private readonly mediaFileAssetRepositroy: MediaFileAssetRepositroy,
  ) {}

  private async preprocess(records: MediaFileEntity[]) {
    const promises = records.filter(Boolean).map(async (record) => {
      // refresh logo
      if (record.iconUrl) {
        try {
          const s3Helpers = new S3Helpers();
          const { refreshed, refreshedUrl } = await s3Helpers.refreshSignedUrl(record.iconUrl);
          if (refreshed) {
            record.iconUrl = refreshedUrl;
            await this.mediaFileRepository.save(record);
          }
        } catch (e) {}
      }
      record.url = encodeURI(record.url);
    });
    await Promise.all(promises);
  }

  public async listRichMedias(teamId: string, dto: ListDto, excludeIds?: string[], filterNeuralModel?: 'only' | 'exclude' | 'all') {
    // 构建 extraWhere 条件，使用 LIKE 查询在数据库层过滤 JSON 字符串
    let extraWhere: any = undefined;

    if (filterNeuralModel === 'only') {
      // 只显示 neural-model：使用 LIKE 匹配 JSON 字符串中的 type 字段
      // params 存储格式: {"type":"neural-model",...}
      extraWhere = {
        params: Like('%"type":"neural-model"%'),
      };
    } else if (filterNeuralModel === 'exclude') {
      // 排除 neural-model：使用 NOT LIKE
      extraWhere = {
        params: Not(Like('%"type":"neural-model"%')),
      };
    }
    // filterNeuralModel === 'all' 时，extraWhere 保持 undefined

    // 使用数据库层的过滤和分页
    const { list, totalCount } = await this.mediaFileAssetRepositroy.listAssets(
      'media-file',
      teamId,
      dto,
      {
        withTags: true,
        withTeam: true,
        withUser: true,
      },
      undefined,
      extraWhere,
      excludeIds,
    );

    await this.preprocess(list);
    return {
      list,
      totalCount,
    };
  }

  public async updateMedia(id: string, teamId: string, updates: { iconUrl?: string; displayName?: string; description?: string; params?: any }) {
    const media = await this.mediaFileRepository.findOne({
      where: {
        id,
        teamId,
        isDeleted: false,
      },
    });

    if (!media) {
      return null;
    }

    if (updates.iconUrl !== undefined) {
      media.iconUrl = updates.iconUrl;
    }
    if (updates.displayName !== undefined) {
      media.displayName = updates.displayName;
    }
    if (updates.description !== undefined) {
      media.description = updates.description;
    }
    if (updates.params !== undefined) {
      media.params = updates.params;
    }

    media.updatedTimestamp = Date.now();
    return await this.mediaFileRepository.save(media);
  }

  public async deleteMedia(teamId: string, id: string) {
    const data = await this.mediaFileRepository.findOne({
      where: {
        id,
        teamId,
      },
    });
    if (!data) {
      return;
    }
    await this.mediaFileRepository.update(
      {
        id,
        teamId,
      },
      {
        isDeleted: true,
      },
    );
  }

  public async getMediaById(id: string) {
    const data = await this.mediaFileRepository.findOne({
      where: {
        id: id,
      },
    });
    await this.preprocess([data]);
    return data;
  }

  public async getMediaByIds(ids: string[]) {
    if (!ids || ids.length === 0) {
      return [];
    }
    const data = await this.mediaFileRepository.findBy({
      id: In(ids),
      isDeleted: false,
    });
    await this.preprocess(data);
    return data;
  }

  public async getMediaByMd5(teamId: string, md5: string) {
    const data = await this.mediaFileRepository.findOne({
      where: {
        md5,
        teamId,
        isDeleted: false,
      },
    });
    await this.preprocess([data]);
    return data;
  }

  public async createMedia(teamId: string, userId: string, body: CreateRichMediaDto) {
    const { url, source = MediaSource.UPLOAD, displayName, description, params, type, size, md5 } = body;
    const mediaId = generateDbId();
    await this.mediaFileRepository.save({
      id: mediaId,
      iconUrl: '',
      description: description || '',
      type,
      teamId,
      creatorUserId: userId,
      displayName,
      url,
      source: source as any,
      params,
      size,
      md5,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
    });
    return await this.getMediaById(mediaId);
  }

  public async getMediaByIdAndTeamId(id: string, teamId: string) {
    console.log('🔍 [DEBUG] getMediaByIdAndTeamId called with:', { id, teamId });

    const data = await this.mediaFileRepository.findOne({
      where: {
        id: id,
        teamId: teamId,
      },
    });

    if (!data) {
      console.log('❌ [DEBUG] Media file not found');
      return null;
    }

    console.log('✅ [DEBUG] Found media file:', {
      id: data.id,
      displayName: data.displayName,
      assetType: data.assetType,
    });

    await this.preprocess([data]);

    // 填充额外信息（标签、团队、用户），与列表查询保持一致
    const [enrichedData] = await this.mediaFileAssetRepositroy.assetCommonRepository.fillAdditionalInfoList([data], {
      withTags: true,
      withTeam: true,
      withUser: true,
    });

    console.log('📦 [DEBUG] Enriched data:', {
      id: enrichedData?.id,
      hasAssetTags: !!enrichedData?.assetTags,
      assetTagsCount: enrichedData?.assetTags?.length || 0,
      assetTags: enrichedData?.assetTags,
      hasUser: !!enrichedData?.user,
      hasTeam: !!enrichedData?.team,
    });

    return enrichedData;
  }

  public async togglePin(mediaId: string, teamId: string, pinned: boolean) {
    if (pinned) {
      // 置顶：找到当前最大的 sort 值，然后设置为比它更大的值
      const maxSortMedia = await this.mediaFileRepository.findOne({
        where: {
          teamId,
          isDeleted: false,
        },
        order: {
          sort: 'DESC',
        },
      });

      // 获取当前最大值，如果存在则 +1，否则设置为 1（因为默认是0）
      const newSort = maxSortMedia?.sort != null ? maxSortMedia.sort + 1 : 1;

      await this.mediaFileRepository.update(mediaId, {
        sort: newSort,
        updatedTimestamp: Date.now(),
      });
    } else {
      // 取消置顶：将 sort 设置为 0（默认值）
      await this.mediaFileRepository.update(mediaId, {
        sort: 0,
        updatedTimestamp: Date.now(),
      });
    }
  }
}
