import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class UploadFileWithTagsDto {
  @ApiProperty({
    description: '文件名称',
    example: 'my-image.png',
  })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: '标签ID列表',
    example: ['691d44147b3d7a12cf46a227', '691d63d20fbd57442f000f2b'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  tagIds: string[];
}
