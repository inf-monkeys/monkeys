import { WorkflowOutputValue } from '@/database/entities/workflow/workflow-metadata';
import { BlockDefProperties, MonkeyWorkflowDef } from '@inf-monkeys/vines';
import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export class UpdateWorkflowDefDto {
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
    name: 'displayName',
    type: String,
    required: false,
  })
  @Joiful.string()
  displayName?: string;

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
    name: 'iconUrl',
    type: String,
    required: false,
  })
  @Joiful.string()
  iconUrl?: string;

  @ApiProperty({
    description: '工作流是否激活',
    name: 'active',
    type: Boolean,
    required: false,
  })
  @Joiful.boolean()
  active?: boolean;

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

  @ApiProperty({
    description: '是否暴露 OpenAI 兼容接口',
    required: false,
    type: Boolean,
  })
  exposeOpenaiCompatibleInterface: boolean;

  @ApiProperty({
    description: 'OpenAI 模型名称',
    required: false,
    type: String,
  })
  openaiModelName: string;
}
