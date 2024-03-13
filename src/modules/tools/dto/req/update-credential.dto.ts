import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export class UpdateCredentialDto {
  @ApiProperty({
    description: '密钥名称',
    type: String,
    required: false,
    example: '测试',
  })
  @Joiful.string()
  displayName: string;

  @ApiProperty({
    description: '密钥数据，服务器将会加密存储',
    type: Object,
    required: true,
  })
  data: any;
}
