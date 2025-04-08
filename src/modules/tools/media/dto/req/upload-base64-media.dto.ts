import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export class UploadBase64MediaDto {
  @ApiProperty({
    description: 'Base64 数据',
    type: String,
    required: true,
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=',
  })
  @Joiful.string().required()
  base64: string;

  @ApiProperty({
    description: '文件拓展名',
    type: String,
    required: false,
    example: 'png',
  })
  @Joiful.string().optional()
  fileExtension?: string;
}
