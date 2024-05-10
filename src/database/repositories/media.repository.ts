import { ListDto } from '@/common/dto/list.dto';
import { S3Helpers } from '@/common/s3';
import { generateDbId } from '@/common/utils';
import { MediaSource } from '@/database/entities/assets/media/media-file';
import { CreateRichMediaDto } from '@/modules/assets/media/dto/req/create-rich-media.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaFileEntity } from '../entities/assets/media/media-file';
import { MediaFileAssetRepositroy } from './assets-media-file.repository';

@Injectable()
export class MediaFileRepository {
  constructor(
    @InjectRepository(MediaFileEntity)
    private readonly mediaFileRepository: Repository<MediaFileEntity>,
    private readonly mediaFileAssetRepositroy: MediaFileAssetRepositroy,
  ) {}

  private async refreshLogo(records: MediaFileEntity[]) {
    const s3Helpers = new S3Helpers();
    const promises = records.filter(Boolean).map(async (record) => {
      if (record.iconUrl) {
        try {
          const { refreshed, refreshedUrl } = await s3Helpers.refreshSignedUrl(record.iconUrl);
          if (refreshed) {
            record.iconUrl = refreshedUrl;
            await this.mediaFileRepository.save(record);
          }
        } catch (e) {}
      }
    });
    await Promise.all(promises);
  }

  public async listRichMedias(teamId: string, dto: ListDto) {
    const { list, totalCount } = await this.mediaFileAssetRepositroy.listAssets('media-file', teamId, dto, {
      withTags: true,
      withTeam: true,
      withUser: true,
    });
    await this.refreshLogo(list);
    return {
      list,
      totalCount,
    };
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
    await this.refreshLogo([data]);
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
    await this.refreshLogo([data]);
    return data;
  }

  public async createMedia(teamId: string, userId: string, body: CreateRichMediaDto) {
    const { url, source = MediaSource.UPLOAD, displayName, params, type, size, md5 } = body;
    const mediaId = generateDbId();
    await this.mediaFileRepository.save({
      id: mediaId,
      iconUrl: '',
      description: '',
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
}
