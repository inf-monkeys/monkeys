import { config } from '@/common/config';
import { ListDto } from '@/common/dto/list.dto';
import { S3Helpers } from '@/common/s3';
import { MediaFileEntity } from '@/database/entities/assets/media/media-file';
import { MediaFileRepository } from '@/database/repositories/media.repository';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateRichMediaDto } from './dto/req/create-rich-media.dto';

@Injectable()
export class MediaFileService {
  private readonly logger = new Logger(MediaFileService.name);

  constructor(private readonly mediaRepository: MediaFileRepository) {}

  public async listRichMedias(teamId: string, dto: ListDto) {
    return await this.mediaRepository.listRichMedias(teamId, dto);
  }

  public async deleteMedia(teamId: string, id: string) {
    return await this.mediaRepository.deleteMedia(teamId, id);
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
      throw new BadRequestException('md5 不合法');
    }

    const existsData = await this.mediaRepository.getMediaByMd5(teamId, md5);
    if (existsData) {
      return existsData;
    }

    const data = await this.mediaRepository.createMedia(teamId, userId, body);
    return data;
  }

  /**
   * 获取媒体文件的公网可访问 URL (更健壮的版本)
   * @param media 媒体文件实体
   * @returns 公网 URL (如果是私有 S3 桶，则为预签名 URL)
   */
  public async getPublicUrl(media: MediaFileEntity): Promise<string> {
    // 1. 如果 S3 桶本身就是公开的，直接返回存储的 URL
    if (!config.s3.isPrivate) {
      this.logger.debug(`S3 bucket is public, returning original URL: ${media.url}`);
      return media.url;
    }

    // 2. 如果是私有桶，需要生成预签名 URL
    this.logger.debug(`S3 bucket is private. Attempting to generate a signed URL for: ${media.url}`);
    let s3Key: string | null = null;

    try {
      // 尝试将存储的 URL 解析为一个标准 URL 对象
      const urlObject = new URL(media.url);
      // 优先从 'key' 查询参数中获取 S3 Key
      s3Key = urlObject.searchParams.get('key');

      // 如果没有 'key' 参数，则从路径中提取
      if (!s3Key) {
        s3Key = urlObject.pathname;
      }
    } catch (e) {
      // 如果解析失败（例如，media.url 是一个相对路径如 '/user-files/...'），
      // 就直接将整个 media.url 视为 S3 Key
      this.logger.debug(`Could not parse media.url "${media.url}" as a full URL. Assuming it is the S3 key.`);
      s3Key = media.url;
    }

    if (!s3Key) {
      this.logger.error(`Could not determine S3 key from media.url: ${media.url}`);
      return media.url; // 返回原始 URL 作为后备
    }

    // 清理 S3 Key，移除可能存在的前导斜杠
    s3Key = s3Key.startsWith('/') ? s3Key.substring(1) : s3Key;
    this.logger.debug(`Extracted S3 key: ${s3Key}`);

    try {
      const s3Helpers = new S3Helpers();
      const signedUrl = await s3Helpers.getSignedUrl(s3Key);
      this.logger.debug(`Successfully generated signed URL for key ${s3Key}: ${signedUrl.substring(0, 100)}...`);
      return signedUrl;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL for S3 key "${s3Key}". Returning original URL.`, error);
      // 如果生成签名失败，返回原始URL并记录详细错误
      return media.url;
    }
  }
}
