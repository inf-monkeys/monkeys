import { config } from '@/common/config';
import { SuccessResponse } from '@/common/response';
import { S3Helpers } from '@/common/s3';
import { getMimeType } from '@/common/utils/file';
import { Body, Controller, Get, Head, NotFoundException, Post, Query, Res, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { nanoid } from 'ai';
import { Response } from 'express';
import { Readable } from 'stream';
import { MediaFileService } from './media.service';

const parseBoolean = (value?: string) => {
  if (value === undefined || value === null) {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'n'].includes(normalized)) {
    return false;
  }
  return undefined;
};

@Controller('medias')
export class MediaUploadController {
  constructor(private readonly mediaFileService: MediaFileService) {}

  @Get('/s3/configs')
  async genStsToken() {
    return new SuccessResponse({
      data: {
        proxy: config?.s3?.proxy ?? false,
        region: config.s3.region,
        baseUrl: config.s3.publicAccessUrl + '/',
        isPrivate: config.s3.isPrivate,
      },
    });
  }

  @Get('/s3/sign')
  async getSignedUrl(@Query('key') key) {
    const s3Helpers = new S3Helpers();
    const data = await s3Helpers.getSignedUrl(key);
    return new SuccessResponse({
      data,
    });
  }

  @Get('/s3/sign-proxy')
  async getProxySignedUrl(@Query('key') key, @Query('u403') u403, @Res({ passthrough: true }) res: Response) {
    const s3Helpers = new S3Helpers();

    if (!key) {
      throw new Error('Key is required');
    }

    const decodedKey = decodeURIComponent(key);
    const cleanKey = decodedKey.replace(/^\/+|\?.*$/g, '');

    if (u403) {
      const data = await s3Helpers.getSignedUrl(cleanKey);
      res.redirect(data);
    } else {
      try {
        const file = await s3Helpers.getFile(cleanKey);
        const fileName = cleanKey.split('/').pop()?.split('?')[0] || 'file';
        const mimeType = getMimeType(fileName) || file.ContentType;

        res.set('Content-Type', mimeType);
        res.set('Content-Length', file.ContentLength.toString());
        res.set('Last-Modified', file.LastModified.toUTCString());
        res.set('ETag', file.ETag);
        res.set('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

        return new StreamableFile(file.Body as Readable);
      } catch (error) {
        console.error(error);
        throw new Error('File not found.');
      }
    }
  }

  @Get('/s3/presign')
  async getPreSignedUrl(@Query('key') key: string) {
    const s3Helpers = new S3Helpers();
    const data = await s3Helpers.getSignedUrlForUpload(key);
    return new SuccessResponse({
      data,
    });
  }

  @Head('/s3/thumbnail')
  async getThumbnailHead(
    @Query('url') url: string,
    @Query('width') width?: string,
    @Query('height') height?: string,
    @Query('longestSide') longestSide?: string,
    @Query('mode') mode?: string,
    @Query('fallback') fallback: string = 'true',
    @Query('forceRegenerate') forceRegenerate?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const parseOptionalNumber = (value?: string) => {
      if (value === undefined || value === null || value === '') {
        return undefined;
      }
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    };

    const parsedWidth = parseOptionalNumber(width);
    const parsedHeight = parseOptionalNumber(height);
    const parsedLongestSide = parseOptionalNumber(longestSide);
    const shouldForceRegenerate = forceRegenerate === 'true';

    try {
      await this.mediaFileService.getThumbnailByUrl({
        url,
        mode: mode === 'exact' || mode === 'longest-edge' ? (mode as 'exact' | 'longest-edge') : undefined,
        width: parsedWidth,
        height: parsedHeight,
        longestSide: parsedLongestSide,
        forceRegenerate: shouldForceRegenerate,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        if (parseBoolean(fallback)) {
          res.status(200).end();
          return;
        }
        throw error;
      }
      throw error;
    }

    if (res) {
      res.status(200).end();
    }
    return;
  }

  @Get('/s3/thumbnail')
  async getThumbnailByUrl(
    @Query('url') url: string,
    @Query('width') width?: string,
    @Query('height') height?: string,
    @Query('longestSide') longestSide?: string,
    @Query('mode') mode?: string,
    @Query('fallback') fallback: string = 'true',
    @Query('forceRegenerate') forceRegenerate?: string,
    @Query('redirect') redirect?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const parseOptionalNumber = (value?: string) => {
      if (value === undefined || value === null || value === '') {
        return undefined;
      }
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    };

    const parsedWidth = parseOptionalNumber(width);
    const parsedHeight = parseOptionalNumber(height);
    const parsedLongestSide = parseOptionalNumber(longestSide);
    const shouldForceRegenerate = forceRegenerate === 'true';

    const redirectPreference = parseBoolean(redirect);
    const shouldRedirect = redirectPreference ?? true;

    try {
      const result = await this.mediaFileService.getThumbnailByUrl({
        url,
        mode: mode === 'exact' || mode === 'longest-edge' ? (mode as 'exact' | 'longest-edge') : undefined,
        width: parsedWidth,
        height: parsedHeight,
        longestSide: parsedLongestSide,
        forceRegenerate: shouldForceRegenerate,
      });

      if (shouldRedirect && res) {
        res.redirect(301, result.url);
        return;
      }

      return new SuccessResponse({
        data: {
          url: result.url,
          etag: result.etag,
          isNewlyGenerated: result.isNewlyGenerated,
          bucketId: result.bucketId,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        if (parseBoolean(fallback)) {
          if (shouldRedirect && res) {
            res.redirect(301, url);
            return;
          } else {
            return new SuccessResponse({
              data: {
                url: url,
                etag: '',
                isNewlyGenerated: false,
                bucketId: '',
              },
            });
          }
        }
        throw error;
      }
      throw error;
    }
  }

  @Post('/s3/file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFileStream(@UploadedFile() file: any, @Body('key') key: string) {
    const s3Helpers = new S3Helpers();
    // NOTE: 原有的缩略图生成逻辑已交由独立服务处理，这里禁用本地生成与上传缩略图。
    const suffix = key.split('.').pop()?.toLowerCase();
    if (config.s3.randomFilename) {
      const id = nanoid();
      key = `r/${id}.${suffix}`;
    }
    const url = await s3Helpers.uploadFile(file.buffer, key);
    const data = config.s3.isPrivate ? await s3Helpers.getSignedUrl(key) : url;
    return new SuccessResponse({
      data,
    });
  }
}
