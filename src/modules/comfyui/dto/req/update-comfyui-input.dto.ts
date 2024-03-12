import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export class UpdateComfyUIInputDto {
  @ApiProperty({
    description: 'Server name',
    type: String,
    required: true,
    default: 'false',
  })
  @Joiful.string().required()
  serverName: string;

  @ApiProperty({
    description: 'Block Name',
    type: String,
    required: false,
    default: 'false',
  })
  @Joiful.string().required()
  blockName: string;
}
