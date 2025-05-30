import {
  MonkeyToolCategories,
  MonkeyToolDescription,
  MonkeyToolDisplayName,
  MonkeyToolIcon,
  MonkeyToolInput,
  MonkeyToolName,
  MonkeyToolOutput,
} from '@/common/decorators/monkey-block-api-extensions.decorator';
import { S3Helpers } from '@/common/s3';
import { ApiType, AuthType, ManifestJson, SchemaVersion } from '@/common/typings/tools';
import { getFileExtensionFromMimeType } from '@/common/utils/file';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { nanoid } from 'nanoid';
import { UploadBase64MediaDto } from './dto/req/upload-base64-media.dto';
import { MEDIA_TOOL_OPENAPI_PATH } from './media.swagger';
@Controller('/media-tool')
@ApiTags('媒体工具')
export class MediaToolsController {
  @Get('/manifest.json')
  @ApiExcludeEndpoint()
  public getMetadata(): ManifestJson {
    return {
      schema_version: SchemaVersion.v1,
      display_name: '媒体工具',
      namespace: 'monkey_tools_media',
      auth: {
        type: AuthType.none,
      },
      api: {
        type: ApiType.openapi,
        url: `${MEDIA_TOOL_OPENAPI_PATH}-json`,
      },
      contact_email: 'dev@inf-monkeys.com',
    };
  }

  @Post('/upload-base64-media')
  @ApiOperation({
    summary: '上传 Base64 媒体到存储桶',
    description: '上传 Base64 媒体到存储桶',
  })
  @MonkeyToolName('upload_base64_media')
  @MonkeyToolDisplayName({
    'zh-CN': '上传 Base64 媒体到存储桶',
    'en-US': 'Upload Base64 Media to Storage Bucket',
  })
  @MonkeyToolCategories(['extra'])
  @MonkeyToolDescription({
    'zh-CN': '将 Base64 数据上传至存储桶，并获得 url',
    'en-US': 'Upload Base64 Media to Storage Bucket and get url',
  })
  @MonkeyToolIcon('emoji:📁:#d9caf8')
  @MonkeyToolInput([
    {
      name: 'base64',
      displayName: {
        'zh-CN': 'Base64 数据',
        'en-US': 'Base64 Data',
      },
      required: true,
      type: 'string',
    },
    {
      name: 'fileExtension',
      displayName: {
        'zh-CN': '文件拓展名',
        'en-US': 'File Extension',
      },
      description: {
        'zh-CN': '文件拓展名，如果为空，则自动生成',
        'en-US': 'File Extension, if empty, it will be generated automatically',
      },
      required: false,
      default: '',
      type: 'string',
    },
  ])
  @MonkeyToolOutput([
    {
      name: 'url',
      displayName: {
        'zh-CN': 'url',
        'en-US': 'Url',
      },
      description: {
        'zh-CN': '上传后的 url',
        'en-US': 'Uploaded url',
      },
      required: false,
      type: 'string',
    },
  ])
  public async uploadBase64Media(@Body() body: UploadBase64MediaDto) {
    let { base64, fileExtension } = body;

    const matches = base64.match(/^data:(.*?);base64,(.*)$/);
    if (!matches) {
      throw new Error('Invalid base64 data URL');
    }
    const contentType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    if (fileExtension.trim() === '') {
      fileExtension = getFileExtensionFromMimeType(contentType);
    }

    const fileName = `${nanoid()}${fileExtension ? '.'.concat(fileExtension) : ''}`;

    const s3Helpers = new S3Helpers();

    const url = await s3Helpers.uploadFile(buffer, `media-tools/uploaded/${fileName}`);
    return {
      url,
    };
  }
}
