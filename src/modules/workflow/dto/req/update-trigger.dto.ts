import { WebhookTriggerConfig, WorkflowTriggerType } from '@/database/entities/workflow/workflow-trigger';
import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export class UpdateWorkflowTriggerDto {
  @ApiProperty({
    description: '触发器类型',
    name: 'type',
    enum: WorkflowTriggerType,
    required: true,
  })
  @Joiful.any().required()
  type: WorkflowTriggerType;

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
    description: '其他配置',
    name: 'extraData',
    type: Object,
    required: false,
  })
  extraData?: { [x: string]: any };
}
