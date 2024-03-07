import { WorkflowTask } from '@io-orkes/conductor-javascript';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateWorkflowDto {
  @ApiProperty({
    description: '工作流 task 定义',
    required: true,
  })
  tasks: WorkflowTask[];

  @ApiProperty({
    description: '输出',
  })
  output: any[];
}
