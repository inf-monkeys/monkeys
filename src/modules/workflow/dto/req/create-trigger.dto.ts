import { WebhookTriggerConfig, WorkflowTriggerType } from '@/entities/workflow/workflow-trigger';
import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export class CreateWorkflowTriggerDto {
  @ApiProperty({
    description: '触发器类型',
    name: 'triggerType',
    enum: WorkflowTriggerType,
    required: true,
  })
  @Joiful.any().required()
  triggerType: WorkflowTriggerType;

  @ApiProperty({
    description: '是否启用',
    name: 'enabled',
    type: Boolean,
    required: true,
    default: false,
  })
  @Joiful.boolean().optional()
  enabled?: boolean;

  @ApiProperty({
    description: 'corn 表达式，SCHEDULER 类型触发器必填',
    name: 'cron',
    type: String,
    required: false,
  })
  @Joiful.string().optional()
  cron?: string;

  @ApiProperty({
    description: 'Webhook 触发器配置',
    name: 'webhookConfig',
    type: Object,
    required: false,
  })
  webhookConfig?: WebhookTriggerConfig;

  @ApiProperty({
    description: '工作流版本',
    name: 'version',
    type: Number,
    required: true,
    default: 1,
  })
  @Joiful.number().optional()
  version: number;
}
