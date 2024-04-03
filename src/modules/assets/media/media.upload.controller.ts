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
      },
    });
  }

  @Get('/s3/presign')
  async getSignedUrl(@Query('key') key: string) {
    const s3Helpers = new S3Helpers();
    const data = await s3Helpers.getUploadFileSignedUrl(key);
    return new SuccessResponse({
      data,
    });
  }
}
