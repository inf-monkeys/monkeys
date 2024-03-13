import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export class ListCredentialsDto {
  @ApiProperty({
    description: '密钥类型',
    type: String,
    required: false,
  })
  @Joiful.string()
  credentialType?: string;
}
