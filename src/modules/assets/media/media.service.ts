import { ListDto } from '@/common/dto/list.dto';
import { MediaFileRepository } from '@/database/repositories/media.repository';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRichMediaDto } from './dto/req/create-rich-media.dto';

@Injectable()
export class MediaFileService {
  constructor(private readonly mediaRepository: MediaFileRepository) {}

  public async listRichMedias(teamId: string, dto: ListDto) {
    return await this.mediaRepository.listRichMedias(teamId, dto);
  }

  public async getMediaById(id: string) {
    return await this.mediaRepository.getMediaById(id);
  }

  public async getMediaByMd5(teamId: string, md5: string) {
    return await this.mediaRepository.getMediaByMd5(teamId, md5);
  }

  public async createMedia(teamId: string, userId: string, body: CreateRichMediaDto) {
    const md5 = body.md5 as string;
    if (md5 && md5.length !== 32) {
      return new BadRequestException('md5 不合法');
    }

    const existsData = await this.mediaRepository.getMediaByMd5(md5, teamId);
    if (existsData) {
      return existsData;
    }

    const data = await this.mediaRepository.createMedia(teamId, userId, body);
    return data;
  }
}
