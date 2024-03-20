import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export class CreateApiKeyDto {
  @ApiProperty({
    description: '描述',
    name: 'desc',
    type: String,
    required: false,
  })
  @Joiful.string()
  desc: string;

  // 外部应用使用的字段
  appName?: string;

  // 视图使用的字段
  pageId?: string;

  isPrivate?: true;
}
