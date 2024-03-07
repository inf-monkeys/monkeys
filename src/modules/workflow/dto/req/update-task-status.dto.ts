import { Task } from '@io-orkes/conductor-javascript';
import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export class UpdateTaskStatusDto {
  @ApiProperty({
    description: '失败原因',
    required: false,
    type: String,
  })
  @Joiful.string()
  reasonForIncompletion: string;

  @ApiProperty({
    description: 'Task 状态',
    required: false,
  })
  status: Task['status'];

  @ApiProperty({
    description: '输出结果',
    required: false,
    type: Object,
  })
  outputData: { [x: string]: any };
}
