import { WorkflowOutputValue } from '@/database/entities/workflow/workflow-metadata';
import { WorkflowTask } from '@inf-monkeys/conductor-javascript';
import { ApiProperty } from '@nestjs/swagger';

export class DebugWorkflowDto {
  @ApiProperty({
    description: '工作流 task 定义',
    required: true,
  })
  tasks: WorkflowTask[];

  @ApiProperty({
    description: '启动数据',
    required: false,
  })
  inputData: { [x: string]: any };

  @ApiProperty({
    description: '工作流输出配置',
    required: false,
    name: 'output',
  })
  output?: WorkflowOutputValue[];
}
