import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export class AddTagToAssetDto {
  @ApiProperty({
    required: true,
    isArray: true,
    type: String,
  })
  @Joiful.array()
    .items((s) => s.string())
    .required()
  tagIds: string[];

  @ApiProperty({
    required: false,
    description: '是否合并模式：true=合并（追加新标签到现有标签），false=替换（完全替换现有标签），默认为 true',
    default: true,
  })
  @Joiful.boolean().optional().default(true)
  merge?: boolean;
}
