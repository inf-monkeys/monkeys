import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';
import { CreateRichMediaDto } from './create-rich-media.dto';

/**
 * 验证其为必填的对象数组。
 */
const IsRequiredObjectArray = Joiful.array()
  .required()
  .items((s) => s.object());

// --- DTO 定义 ---

export class BulkCreateMediaDto {
  @ApiProperty({
    description: '批量创建的媒体文件列表',
    name: 'mediaList',
    type: [CreateRichMediaDto],
    required: true,
  })
  @IsRequiredObjectArray
  mediaList: CreateRichMediaDto[];

  @ApiProperty({
    description: '关联的评测模块ID (可选，创建后自动添加到评测模块)',
    name: 'evaluationModuleId',
    type: String,
    required: false,
  })
  @Joiful.string()
  evaluationModuleId?: string;
}
