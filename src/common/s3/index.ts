import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { config } from '../config';

export class S3Helpers {
  client: S3Client;

  constructor() {
    this.checkS3Config();
    this.client = new S3Client({
      credentials: {
        accessKeyId: config.s3.aws_access_key_id,
        secretAccessKey: config.s3.aws_secret_access_key,
      },
      endpoint: config.s3.endpoint_url,
      region: config.s3.region_name,
    });
  }

  private checkS3Config() {
    if (config.s3.aws_access_key_id && config.s3.aws_secret_access_key && config.s3.region_name && config.s3.endpoint_url && config.s3.bucket_name) {
      return;
    }
    throw new Error('未配置 s3 存储，请联系管理员');
  }

  public async getFile(fileKey: string) {
    const command = new GetObjectCommand({
      Bucket: config.s3.bucket_name,
      Key: fileKey,
    });
    const res = await this.client.send(command);
    return res;
  }

  public async uploadFile(fileBuffer: string | Buffer | Readable | ReadableStream<any> | Blob | Uint8Array, fileKey: string) {
    const command = new PutObjectCommand({
      Bucket: config.s3.bucket_name,
      Key: fileKey,
      Body: fileBuffer,
    });
    await this.client.send(command);
    return config.s3.public_access_url + '/' + fileKey;
  }

  public async deleteFile(fileKey: string) {
    const command = new DeleteObjectCommand({
      Bucket: config.s3.bucket_name,
      Key: fileKey,
    });
    const res = await this.client.send(command);
    return res;
  }

  public async getFileSignedUrl(fileKey: string) {
    const command = new GetObjectCommand({
      Bucket: config.s3.bucket_name,
      Key: fileKey,
    });

    const res = await getSignedUrl(this.client, command, { expiresIn: 3600 });
    return res;
  }

  public async getUploadFileSignedUrl(fileKey: string) {
    const command = new PutObjectCommand({
      Bucket: config.s3.bucket_name,
      Key: fileKey,
      ContentType: '*/*',
    });
    const res = await getSignedUrl(this.client, command, { expiresIn: 3600 });
    return res;
  }
}
