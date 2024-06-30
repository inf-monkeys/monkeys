import { config } from '@/common/config';
import { SuccessResponse } from '@/common/response';
import { S3Helpers } from '@/common/s3';
import { Body, Controller, Get, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

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
    await s3Helpers.uploadFile(file.buffer, key);
    const data = await s3Helpers.getSignedUrl(key);
    return new SuccessResponse({
      data,
    });
  }
}
