import { ListDto } from '@/common/dto/list.dto';
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
    private readonly mediaFileEntity: Repository<MediaFileEntity>,
    private readonly mediaFileAssetRepositroy: MediaFileAssetRepositroy,
  ) {}

  public async listRichMedias(teamId: string, dto: ListDto) {
    return await this.mediaFileAssetRepositroy.listAssets('media-file', teamId, dto, {
      withTags: true,
      withTeam: true,
      withUser: true,
    });
  }

  public async deleteMedia(teamId: string, id: string) {
    const data = await this.mediaFileEntity.findOne({
      where: {
        id,
        teamId,
      },
    });
    if (!data) {
      return;
    }
    await this.mediaFileEntity.update(
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
    return await this.mediaFileEntity.findOne({
      where: {
        id: id,
      },
    });
  }

  public async getMediaByMd5(teamId: string, md5: string) {
    const data = await this.mediaFileEntity.findOne({
      where: {
        md5,
        teamId,
      },
    });
    return data;
  }

  public async createMedia(teamId: string, userId: string, body: CreateRichMediaDto) {
    const { url, source = MediaSource.UPLOAD, displayName, params, type, size, md5 } = body;
    const mediaId = generateDbId();
    await this.mediaFileEntity.save({
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
