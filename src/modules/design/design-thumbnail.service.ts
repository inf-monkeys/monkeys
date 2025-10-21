import { S3Helpers } from '@/common/s3';
import { DesignMetadataRepository } from '@/database/repositories/design-metadata.repository';
import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';

@Injectable()
export class DesignThumbnailService {
  constructor(
    private readonly designMetadataRepository: DesignMetadataRepository,
  ) {}

  /**
   * 从Base64图片数据更新画板缩略图
   */
  async updateBoardThumbnailFromImageData(boardId: string, imageData: string): Promise<void> {
    try {
      // 验证Base64数据格式
      if (!imageData || imageData.length < 100) {
        throw new Error('Base64数据无效');
      }
      
      // 将Base64数据转换为Buffer
      const imageBuffer = Buffer.from(imageData, 'base64');

      // 验证Buffer是否为有效的图片数据
      if (imageBuffer.length < 100) {
        throw new Error('图片数据无效');
      }

      // 直接上传到OSS
      const thumbnailKey = `design-boards/page-thumbnails/${boardId}_${nanoid()}.png`;
      const s3Helpers = new S3Helpers();
      const thumbnailUrl = await s3Helpers.uploadFile(imageBuffer, thumbnailKey);

      // 更新数据库
      await this.designMetadataRepository.update(boardId, { thumbnailUrl });
    } catch (error) {
      console.error('更新页面缩略图失败:', error);
      throw error;
    }
  }
}