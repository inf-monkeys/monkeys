import { config } from '@/common/config';
import { S3Helpers } from '@/common/s3';
import { generateThumbnail } from '@/common/utils/image';
import { DesignMetadataRepository } from '@/database/repositories/design-metadata.repository';
import { MediaStorageService } from '@/modules/assets/media/media.storage.service';
import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import sharp from 'sharp';

@Injectable()
export class DesignThumbnailService {
  constructor(
    private readonly designMetadataRepository: DesignMetadataRepository,
    private readonly mediaStorageService: MediaStorageService,
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

      // 预裁剪：尝试去除纯背景边缘，优先聚焦有内容的区域
      let processedBuffer = imageBuffer;
      try {
        processedBuffer = await sharp(imageBuffer).trim({ threshold: 10 }).toBuffer();
      } catch (_) {
        // 忽略预处理失败，继续使用原图
      }

      // 生成裁剪后的缩略图（固定到卡片视图友好的尺寸，智能聚焦）
      const thumb = await generateThumbnail(processedBuffer, {
        width: 640,
        height: 360,
        fit: 'cover',
        format: 'jpeg',
        quality: 70,
      });

      // 上传到存储（使用 jpg 扩展名，减小体积）
      const thumbnailKey = `design-boards/page-thumbnails/${boardId}_${nanoid()}.jpg`;
      let thumbnailUrl: string;

      // 根据配置选择上传方式
      if (config.s3.enableOpendalUpload) {
        // 使用 OpenDAL（支持 Azure Blob 等）
        const result = await this.mediaStorageService.uploadFile({
          key: thumbnailKey,
          buffer: thumb.buffer,
          contentType: 'image/jpeg',
          randomFilename: false,
        });
        thumbnailUrl = result.url;
      } else {
        // 使用传统 S3Helpers
        const s3Helpers = new S3Helpers();
        thumbnailUrl = await s3Helpers.uploadFile(thumb.buffer, thumbnailKey, 'image/jpeg');
      }

      // 更新数据库
      await this.designMetadataRepository.update(boardId, { thumbnailUrl });
    } catch (error) {
      console.error('更新页面缩略图失败:', error);
      throw error;
    }
  }
}