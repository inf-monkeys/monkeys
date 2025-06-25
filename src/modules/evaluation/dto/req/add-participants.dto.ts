import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

/**
 * 验证其为必填的字符串数组。
 */
const IsRequiredStringArray = Joiful.array()
  .required()
  .items((s) => s.string());

// --- DTO 定义 ---

export class AddParticipantsDto {
  @ApiProperty({
    description: '要添加到排行榜的图片资产ID列表',
    name: 'assetIds',
    type: [String],
    required: true,
  })
  @IsRequiredStringArray
  assetIds: string[];
}
