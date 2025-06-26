import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export class StartWorkflowDto {
  @ApiProperty({
    description: '工作流版本，默认为最新版本',
    name: 'version',
    type: Number,
    required: false,
  })
  @Joiful.number().optional()
  version?: number;

  @ApiProperty({
    description: '启动数据',
    required: false,
  })
  inputData: { [x: string]: any };

  @ApiProperty({
    description: '对应的 chat session 会话 id',
    required: false,
    type: String,
  })
  chatSessionId?: string;

  @ApiProperty({
    description: '执行记录分组',
    required: false,
    type: String,
  })
  group?: string;

  @ApiProperty({
    description: '是否等待工作流执行完成之后再返回',
    required: false,
    default: false,
    type: Boolean,
  })
  @Joiful.boolean().optional()
  waitForWorkflowFinished: boolean;

  @ApiProperty({
    description: '执行时的额外元数据',
    required: false,
    type: Object,
  })
  @Joiful.object().optional()
  extraMetadata?: { [x: string]: any };
}
