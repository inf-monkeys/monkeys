import { ListDto } from '@/common/dto/list.dto';
import { S3Helpers } from '@/common/s3';
import { generateDbId } from '@/common/utils';
import { MediaSource } from '@/database/entities/assets/media/media-file';
import { CreateRichMediaDto } from '@/modules/assets/media/dto/req/create-rich-media.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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

  public async listRichMedias(teamId: string, dto: ListDto, excludeIds?: string[]) {
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
      undefined,
      excludeIds,
    );
    await this.preprocess(list);
    return {
      list,
      totalCount,
    };
  }

  public async updateMedia(id: string, teamId: string, updates: { iconUrl?: string; displayName?: string; description?: string }) {
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
    const data = await this.mediaFileRepository.findOne({
      where: {
        id: id,
        teamId: teamId,
      },
    });
    await this.preprocess([data]);
    return data;
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
