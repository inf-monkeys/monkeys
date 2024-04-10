import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export class UpdateWorkflowRateLimiterDto {
  @ApiProperty({
    description: '工作流版本',
    name: 'version',
    type: Number,
    required: true,
    default: 1,
  })
  @Joiful.number().optional()
  version: number;

  @ApiProperty({
    description: '是否开启',
    name: 'enabled',
    type: Boolean,
    required: true,
  })
  @Joiful.boolean().required()
  enabled: boolean;

  @ApiProperty({
    description: '时间窗口大小（毫秒）',
    name: 'windowMs',
    type: Number,
    required: true,
  })
  @Joiful.number().optional()
  windowMs: number;

  @ApiProperty({
    description: '单位时间窗口内运行最大并发',
    name: 'max',
    type: Number,
    required: true,
  })
  @Joiful.number().optional()
  max: number;
}
