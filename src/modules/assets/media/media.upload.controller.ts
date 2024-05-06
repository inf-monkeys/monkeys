import { config } from '@/common/config';
import { SuccessResponse } from '@/common/response';
import { S3Helpers } from '@/common/s3';
import { Controller, Get, Query } from '@nestjs/common';

@Controller('medias')
export class MediaUploadController {
  @Get('/s3/configs')
  async genStsToken() {
    return new SuccessResponse({
      data: {
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
}
