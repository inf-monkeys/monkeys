import { WorkflowOutputValue } from '@/entities/workflow/workflow';
import { BlockDefProperties, MonkeyWorkflowDef } from '@inf-monkeys/vines';
import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';
import { WorkflowTriggerJson } from '../../interfaces';

export class CreateWorkflowDefDto {
  @ApiProperty({
    description: '工作流名称',
    name: 'name',
    type: String,
    required: true,
  })
  @Joiful.string().required()
  name: string;

  @ApiProperty({
    description: '工作流描述',
    name: 'description',
    type: String,
    required: false,
  })
  @Joiful.string()
  description?: string;

  @ApiProperty({
    description: '工作流 LOGO',
    name: 'logo',
    type: String,
    required: false,
  })
  @Joiful.string()
  iconUrl?: string;

  @ApiProperty({
    description: 'conductor workflow json 定义',
    required: true,
  })
  workflowDef: MonkeyWorkflowDef;

  @ApiProperty({
    description: 'workflow 全局变量（非 conductor 能力）',
    required: false,
    name: 'variables',
  })
  variables: BlockDefProperties[];

  @ApiProperty({
    description: '工作流输出配置',
    required: false,
    name: 'output',
  })
  output: WorkflowOutputValue[];

  @Joiful.array()
  tagIds: string[];

  @ApiProperty({
    description: 'Triggers',
    required: false,
    name: 'triggers',
  })
  triggers: WorkflowTriggerJson[];
}
