import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export class StartWorkflowSyncDto {
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
}
