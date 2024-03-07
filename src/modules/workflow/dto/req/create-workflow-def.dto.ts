import { WorkflowOutputValue } from '@/entities/workflow/workflow';
import { BlockDefProperties, MonkeyWorkflowDef } from '@inf-monkeys/vines';
import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

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
    name: 'desc',
    type: String,
    required: false,
  })
  @Joiful.string()
  desc?: string;

  @ApiProperty({
    description: '工作流 LOGO',
    name: 'logo',
    type: String,
    required: false,
  })
  @Joiful.string()
  logo?: string;

  @ApiProperty({
    required: false,
    type: Boolean,
    default: false,
  })
  @Joiful.boolean()
  hidden?: boolean;

  @ApiProperty({
    description: '主工作流 ID',
    required: false,
    type: String,
  })
  @Joiful.string()
  masterWorkflowId?: string;

  @ApiProperty({
    description: '主工作流 ID',
    required: false,
    type: String,
  })
  @Joiful.number()
  masterWorkflowVersion?: number;

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
}
