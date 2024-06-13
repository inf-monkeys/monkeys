import { WorkflowTask } from '@inf-monkeys/conductor-javascript';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateWorkflowDto {
  @ApiProperty({
    description: '工作流 id',
    required: true,
  })
  workflowId: string;

  @ApiProperty({
    description: '工作流版本号',
    required: true,
  })
  workflowVersion: number;

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
