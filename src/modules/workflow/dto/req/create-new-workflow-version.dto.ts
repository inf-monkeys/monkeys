import { WorkflowOutputValue } from '@/database/entities/workflow/workflow-metadata';
import { BlockDefProperties, MonkeyWorkflowDef } from '@inf-monkeys/vines';
import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export class CreateNewVersionWorkflowDefDto {
  @ApiProperty({
    description: '工作流版本',
    name: 'version',
    type: Number,
    required: true,
    default: 1,
  })
  @Joiful.number().optional()
  version: number;

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
    description: 'conductor workflow json 定义',
    required: false,
    name: 'workflowDef',
  })
  workflowDef?: MonkeyWorkflowDef;

  @ApiProperty({
    description: 'workflow 全局变量（非 conductor 能力）',
    required: false,
    name: 'variables',
  })
  variables?: BlockDefProperties[];

  @ApiProperty({
    description: '工作流输出配置',
    required: false,
    name: 'output',
  })
  output?: WorkflowOutputValue[];

  @Joiful.array()
  tagIds: string[];
}
