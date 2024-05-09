import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { config } from '../config';
import { logger } from '../logger';

export class S3Helpers {
  client: S3Client;

  constructor() {
    this.checkS3Config();
    this.client = new S3Client({
      credentials: {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
      },
      endpoint: config.s3.endpoint,
      region: config.s3.region,
      forcePathStyle: config.s3.forcePathStyle,
    });
  }

  private checkS3Config() {
    if (config.s3.accessKeyId && config.s3.secretAccessKey && config.s3.region && config.s3.endpoint && config.s3.bucket) {
      return;
    }
    throw new Error('未配置 s3 存储，请联系管理员');
  }

  public async getFile(fileKey: string) {
    const command = new GetObjectCommand({
      Bucket: config.s3.bucket,
      Key: fileKey,
    });
    const res = await this.client.send(command);
    return res;
  }

  public async uploadFile(fileBuffer: string | Buffer | Readable | ReadableStream<any> | Blob | Uint8Array, fileKey: string) {
    const command = new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: fileKey,
      Body: fileBuffer,
    });
    await this.client.send(command);
    return config.s3.publicAccessUrl + '/' + fileKey;
  }

  public async deleteFile(fileKey: string) {
    const command = new DeleteObjectCommand({
      Bucket: config.s3.bucket,
      Key: fileKey,
    });
    const res = await this.client.send(command);
    return res;
  }

  public async getSignedUrl(fileKey: string) {
    const command = new GetObjectCommand({
      Bucket: config.s3.bucket,
      Key: fileKey,
    });

    const res = await getSignedUrl(this.client, command, { expiresIn: 3600 });
    return res;
  }

  public async getSignedUrlForUpload(fileKey: string) {
    const command = new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: fileKey,
      ContentType: '*/*',
    });
    const res = await getSignedUrl(this.client, command, { expiresIn: 3600 });
    return res;
  }

  private parseAmzDate(dateString: string) {
    // 提取各个部分
    const year = parseInt(dateString.substring(0, 4), 10);
    const month = parseInt(dateString.substring(4, 6), 10) - 1; // JavaScript 的月份从 0 开始
    const day = parseInt(dateString.substring(6, 8), 10);
    const hour = parseInt(dateString.substring(9, 11), 10);
    const minute = parseInt(dateString.substring(11, 13), 10);
    const second = parseInt(dateString.substring(13, 15), 10);

    // 创建 Date 对象并返回时间戳
    const date = new Date(Date.UTC(year, month, day, hour, minute, second));
    return Math.floor(date.getTime() / 1000);
  }

  private isSignedUrl(url: string) {
    return url.includes('X-Amz-Signature');
  }

  public async refreshSignedUrl(signedUrl: string): Promise<{
    refreshed: boolean;
    refreshedUrl?: string;
  }> {
    if (!config.s3.isPrivate) {
      return {
        refreshed: false,
      };
    }
    if (!this.isSignedUrl(signedUrl)) {
      return {
        refreshed: false,
      };
    }
    const url = new URL(signedUrl);
    const amzDate = url.searchParams.get('X-Amz-Date');
    const expires = Number(url.searchParams.get('X-Amz-Expires'));
    const signedTimestamp = this.parseAmzDate(amzDate);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const remainingTime = signedTimestamp + expires - currentTimestamp;
    if (remainingTime > 300) {
      return {
        refreshed: false,
      };
    }
    logger.info('Refreshing signed url', { signedUrl, remainingTime });
    const fileKey = url.pathname.slice(1);
    const refreshedUrl = await this.getSignedUrl(fileKey);
    return {
      refreshed: true,
      refreshedUrl,
    };
  }
}
