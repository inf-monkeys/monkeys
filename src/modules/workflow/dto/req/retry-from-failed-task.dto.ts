import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export class RetryFromFailedTaskDto {
  @ApiProperty({
    description: 'reRunFromTaskId',
    required: true,
    type: String,
  })
  @Joiful.string()
  reRunFromTaskId: string;

  @ApiProperty({
    description: 'workflowInput',
    required: true,
    type: Object,
  })
  @Joiful.any()
  workflowInput: any;

  @ApiProperty({
    description: 'taskInput',
    required: true,
    type: Object,
  })
  @Joiful.any()
  taskInput: any;
}
