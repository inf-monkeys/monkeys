import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export class CreateCredentialDto {
  @ApiProperty({
    description: '密钥名称',
    type: String,
    required: true,
    example: '测试',
  })
  @Joiful.string().required()
  displayName: string;

  @ApiProperty({
    description: '密钥类型',
    type: String,
    required: true,
  })
  @Joiful.string().required()
  type: string;

  @ApiProperty({
    description: '密钥数据，服务器将会加密存储',
    type: Object,
    required: true,
  })
  data: any;
}
