import { ApiProperty } from '@nestjs/swagger';

export class CreateTemporaryWorkflowDto {
  @ApiProperty({
    description: '工作流ID',
    required: true,
    type: String,
  })
  workflowId: string;

  @ApiProperty({
    description: '工作流版本，默认为最新版本',
    required: false,
    type: Number,
  })
  workflowVersion?: number;

  @ApiProperty({
    description: '输入数据',
    required: false,
    type: Object,
  })
  inputData?: Record<string, any>;

  @ApiProperty({
    description: '过期时间（小时），默认24小时',
    required: false,
    type: Number,
    default: 24,
  })
  expiresInHours?: number;

  @ApiProperty({
    description: '团队ID（租户鉴权接口使用）',
    required: false,
    type: String,
  })
  teamId?: string;

  @ApiProperty({
    description: '用户ID（租户鉴权接口使用）',
    required: false,
    type: String,
  })
  userId?: string;
}
