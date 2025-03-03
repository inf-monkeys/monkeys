import { config } from '@/common/config';
import { SuccessResponse } from '@/common/response';
import { S3Helpers } from '@/common/s3';
import { getMimeType } from '@/common/utils/file';
import { Body, Controller, Get, Post, Query, Res, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Readable } from 'stream';

@Controller('medias')
export class MediaUploadController {
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
    const cleanKey = decodedKey.replace(/(^\?+|\?.*$)/g, '');

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
        res.set('Content-Disposition', `attachment; filename="${fileName}"`);

        return new StreamableFile(file.Body as Readable);
      } catch (error) {
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

  @Post('/s3/file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFileStream(@UploadedFile() file: any, @Body('key') key: string) {
    const s3Helpers = new S3Helpers();
    const url = await s3Helpers.uploadFile(file.buffer, key);
    const data = config.s3.isPrivate ? await s3Helpers.getSignedUrl(key) : url;
    return new SuccessResponse({
      data,
    });
  }
}
