import { config } from '@/common/config';
import { ListDto } from '@/common/dto/list.dto';
import { S3Helpers } from '@/common/s3';
import { getFileExtensionFromUrl } from '@/common/utils/file';
import { calculateMd5FromArrayBuffer } from '@/common/utils/markdown-image-utils';
import { MediaFileEntity } from '@/database/entities/assets/media/media-file';
import { MediaFileRepository } from '@/database/repositories/media.repository';
import { ToolsForwardService } from '@/modules/tools/tools.forward.service';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { CreateRichMediaDto } from './dto/req/create-rich-media.dto';

@Injectable()
export class MediaFileService {
  private readonly logger = new Logger(MediaFileService.name);

  constructor(
    private readonly mediaRepository: MediaFileRepository,
    private readonly toolsForwardService: ToolsForwardService,
  ) {}

  public async listRichMedias(teamId: string, dto: ListDto, excludeIds?: string[]) {
    return await this.mediaRepository.listRichMedias(teamId, dto, excludeIds);
  }

  public async deleteMedia(teamId: string, id: string) {
    return await this.mediaRepository.deleteMedia(teamId, id);
  }

  public async getMediaById(id: string) {
    return await this.mediaRepository.getMediaById(id);
  }

  public async getMediaByIds(ids: string[]) {
    return await this.mediaRepository.getMediaByIds(ids);
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

  public async updateMedia(id: string, teamId: string, updates: { iconUrl?: string; displayName?: string; description?: string; params?: any }) {
    return await this.mediaRepository.updateMedia(id, teamId, updates);
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
      // 使用 decodeURI 来确保我们处理的是解码后的路径
      if (!s3Key) {
        s3Key = decodeURI(urlObject.pathname);
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

  public async getMediaByIdAndTeamId(id: string, teamId: string) {
    return await this.mediaRepository.getMediaByIdAndTeamId(id, teamId);
  }

  public async togglePin(mediaId: string, teamId: string, pinned: boolean) {
    return await this.mediaRepository.togglePin(mediaId, teamId, pinned);
  }

  /**
   * 为图片生成描述
   */
  public async ImageGenerateTxt(mediaId: string, teamId: string, userId: string, media: any): Promise<string> {
    // 获取可访问的 URL
    const imageUrl = await this.getPublicUrl(media);

    // 调用 image_to_function 工具
    const result = await this.toolsForwardService.invoke(
      'monkeys_tool_concept_design:image_to_function',
      {
        image: imageUrl,
        function: 'text',
      },
      { teamId, userId },
    );

    const generatedDescription = result?.data;

    if (!generatedDescription) {
      throw new BadRequestException('AI service returned empty result');
    }

    // 更新媒体文件描述
    await this.updateMedia(mediaId, teamId, {
      description: generatedDescription,
    });

    return generatedDescription;
  }

  /**
   * 根据文本生成图片
   */
  public async TextGenerateImage(teamId: string, userId: string, text: string, jsonFileName?: string): Promise<any> {
    // 调用 text_to_image 工具
    const result = await this.toolsForwardService.invoke(
      'monkeys_tool_concept_design:text_to_function',
      {
        text: text,
        function: 'image',
      },
      { teamId, userId },
    );

    const imageUrl = result?.data;

    if (!imageUrl) {
      throw new BadRequestException('AI service returned no image URL');
    }

    // 下载图片
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });
    const buffer = response.data;

    // 计算 MD5
    const md5 = await calculateMd5FromArrayBuffer(buffer);
    if (!md5) {
      throw new BadRequestException('Failed to calculate MD5 for generated image');
    }

    // 检查是否已存在相同 MD5 的媒体文件
    const existingMedia = await this.getMediaByMd5(teamId, md5);
    if (existingMedia) {
      return existingMedia;
    }

    // 上传到 S3
    const s3Helpers = new S3Helpers();
    const fileExtension = getFileExtensionFromUrl(imageUrl) || 'png';
    const s3Key = `ai-generated-images/${md5}.${fileExtension}`;
    const s3UploadedUrl = await s3Helpers.uploadFile(buffer, s3Key);

    // 获取最终 URL（考虑私有桶的签名 URL）
    const finalUrl = config.s3.isPrivate ? await s3Helpers.getSignedUrl(s3Key) : s3UploadedUrl;

    // 生成文件名：AI_generate: "json名称.png"，使用 JSON 文件名
    const fileName = jsonFileName || 'unknown';
    const generatedFileName = `AI_generate:${fileName}.png`;

    // 创建媒体记录
    const createdMedia = await this.createMedia(teamId, userId, {
      type: 'image',
      displayName: generatedFileName,
      url: finalUrl,
      description: text, // 原文内容作为描述
      source: 4, // OUTPUT
      params: {
        originalUrl: imageUrl,
        aiGenerated: true,
        prompt: text,
        s3Key: s3Key,
      },
      size: buffer.byteLength,
      md5,
    });
    return createdMedia;
  }

  /**
   * 从图片生成3D模型
   */
  public async ImageGenerate3DModel(mediaId: string, teamId: string, userId: string, media: any): Promise<any> {
    // 获取可访问的 URL
    const image = await this.getPublicUrl(media);

    // 调用 image_to_function 工具，function 为 'model'
    const result = await this.toolsForwardService.invoke(
      'monkeys_tool_concept_design:image_to_function',
      {
        image: image,
        function: 'model',
      },
      { teamId, userId },
    );

    // 3D模型可能返回文件URL，字段名可能是 modelUrl, url, output, data 等
    const modelUrl = result?.output || result?.data || result?.model || result?.url;

    if (!modelUrl) {
      throw new BadRequestException('AI service returned no 3D model URL');
    }

    // 下载3D模型文件
    const response = await axios.get(modelUrl, {
      responseType: 'arraybuffer',
      timeout: 60000, // 3D模型可能较大，设置更长的超时时间
    });
    const buffer = response.data;

    // 计算 MD5
    const md5 = await calculateMd5FromArrayBuffer(buffer);
    if (!md5) {
      throw new BadRequestException('Failed to calculate MD5 for generated 3D model');
    }

    // 检查是否已存在相同 MD5 的媒体文件
    const existingMedia = await this.getMediaByMd5(teamId, md5);
    if (existingMedia) {
      return existingMedia;
    }

    // 上传到 S3
    const s3Helpers = new S3Helpers();
    // 3D模型常见格式：glb, obj, fbx, stl 等
    const fileExtension = getFileExtensionFromUrl(modelUrl) || 'glb';
    const s3Key = `ai-generated-3d-models/${md5}.${fileExtension}`;
    const s3UploadedUrl = await s3Helpers.uploadFile(buffer, s3Key);

    // 获取最终 URL（考虑私有桶的签名 URL）
    const finalUrl = config.s3.isPrivate ? await s3Helpers.getSignedUrl(s3Key) : s3UploadedUrl;

    // 生成文件名：AI_generate_3D: "原文件名.glb"
    const originalFileName = (media.displayName as string) || 'unknown';
    const fileNameWithoutExt = originalFileName.replace(/\.[^.]+$/, '');
    const generatedFileName = `AI_generate_3D:${fileNameWithoutExt}.${fileExtension}`;

    // 创建媒体记录
    const createdMedia = await this.createMedia(teamId, userId, {
      type: 'text', // 使用 text 类型存储3D模型，通过 params.type 标识为 '3d-model'
      displayName: generatedFileName,
      url: finalUrl,
      description: `Generated from image: ${originalFileName}`, // 说明来源
      source: 4, // OUTPUT
      params: {
        originalUrl: modelUrl,
        aiGenerated: true,
        sourceImageId: mediaId,
        s3Key: s3Key,
        type: '3d-model',
      },
      size: buffer.byteLength,
      md5,
    });

    return createdMedia;
  }

  /**
   * 从图片生成 Markdown 描述
   */
  public async ImageGenerateMarkdown(mediaId: string, teamId: string, userId: string, media: any): Promise<any> {
    // 获取可访问的 URL
    const image = await this.getPublicUrl(media);

    // 调用 image_to_function 工具，function 为 'markdown'
    const result = await this.toolsForwardService.invoke(
      'monkeys_tool_concept_design:image_to_function',
      {
        image: image,
        function: 'markdown',
      },
      { teamId, userId },
    );

    const generatedMarkdown = result?.data;

    if (!generatedMarkdown) {
      throw new BadRequestException('AI service returned empty markdown result');
    }

    // 获取当前媒体文件以保留原有 params
    const currentMedia = await this.getMediaByIdAndTeamId(mediaId, teamId);
    if (!currentMedia) {
      throw new BadRequestException('Media file not found');
    }

    // 更新 params 中的 markdownDescription
    const updatedParams = {
      ...(currentMedia.params || {}),
      markdownDescription: generatedMarkdown,
    };

    // 更新媒体文件，将 markdown 存储在 params 中
    await this.updateMedia(mediaId, teamId, {
      params: updatedParams,
    });

    // 返回更新后的媒体对象
    const updatedMedia = await this.getMediaByIdAndTeamId(mediaId, teamId);
    return updatedMedia;
  }

  /**
   * 根据文本生成 Markdown 描述
   */
  public async TextGenerateMarkdown(mediaId: string, teamId: string, userId: string, text: string): Promise<any> {
    // 调用 text_to_function 工具，function 为 'markdown'
    const result = await this.toolsForwardService.invoke(
      'monkeys_tool_concept_design:text_to_function',
      {
        text: text,
        function: 'markdown',
      },
      { teamId, userId },
    );

    const generatedMarkdown = result?.output || result?.data;

    if (!generatedMarkdown) {
      throw new BadRequestException('AI service returned empty markdown result');
    }

    // 获取当前媒体文件以保留原有 params
    const currentMedia = await this.getMediaByIdAndTeamId(mediaId, teamId);
    if (!currentMedia) {
      throw new BadRequestException('Media file not found');
    }

    // 更新 params 中的 markdownDescription
    const updatedParams = {
      ...(currentMedia.params || {}),
      markdownDescription: generatedMarkdown,
    };

    // 更新媒体文件，将 markdown 存储在 params 中
    await this.updateMedia(mediaId, teamId, {
      params: updatedParams,
    });

    // 返回更新后的媒体对象
    const updatedMedia = await this.getMediaByIdAndTeamId(mediaId, teamId);
    return updatedMedia;
  }

  /**
   * 根据文本生成3D模型
   */
  public async TextGenerate3DModel(teamId: string, userId: string, text: string, jsonFileName?: string): Promise<any> {
    // 调用 text_to_3d_model 工具
    const result = await this.toolsForwardService.invoke(
      'monkeys_tool_concept_design:text_to_function',
      {
        text: text,
        function: 'model',
      },
      { teamId, userId },
    );

    // 3D模型可能返回文件URL，字段名可能是 modelUrl, url, model 等
    const modelUrl = result?.data;

    if (!modelUrl) {
      throw new BadRequestException('AI service returned no 3D model URL');
    }

    // 下载3D模型文件
    const response = await axios.get(modelUrl, {
      responseType: 'arraybuffer',
      timeout: 60000, // 3D模型可能较大，设置更长的超时时间
    });
    const buffer = response.data;

    // 计算 MD5
    const md5 = await calculateMd5FromArrayBuffer(buffer);
    if (!md5) {
      throw new BadRequestException('Failed to calculate MD5 for generated 3D model');
    }

    // 检查是否已存在相同 MD5 的媒体文件
    const existingMedia = await this.getMediaByMd5(teamId, md5);
    if (existingMedia) {
      return existingMedia;
    }

    // 上传到 S3
    const s3Helpers = new S3Helpers();
    // 3D模型常见格式：glb, obj, fbx, stl 等
    const fileExtension = getFileExtensionFromUrl(modelUrl) || 'glb';
    const s3Key = `ai-generated-3d-models/${md5}.${fileExtension}`;
    const s3UploadedUrl = await s3Helpers.uploadFile(buffer, s3Key);

    // 获取最终 URL（考虑私有桶的签名 URL）
    const finalUrl = config.s3.isPrivate ? await s3Helpers.getSignedUrl(s3Key) : s3UploadedUrl;

    // 生成文件名：AI_generate_3D: "json名称.glb"，使用 JSON 文件名
    const fileName = jsonFileName || 'unknown';
    const generatedFileName = `AI_generate_3D:${fileName}.${fileExtension}`;

    // 创建媒体记录
    const createdMedia = await this.createMedia(teamId, userId, {
      type: 'text', // 使用 text 类型存储3D模型，通过 params.type 标识为 '3d-model'
      displayName: generatedFileName,
      url: finalUrl,
      description: text, // 原文内容作为描述
      source: 4, // OUTPUT
      params: {
        originalUrl: modelUrl,
        aiGenerated: true,
        prompt: text,
        s3Key: s3Key,
        type: '3d-model',
      },
      size: buffer.byteLength,
      md5,
    });

    return createdMedia;
  }
}
