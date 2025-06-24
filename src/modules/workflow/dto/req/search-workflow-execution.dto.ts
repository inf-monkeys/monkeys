import { OrderBy } from '@/common/dto/order.enum';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { WorkflowStatusEnum } from '@/common/dto/status.enum';
import { WorkflowTriggerType } from '@/database/entities/workflow/workflow-trigger';
import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export enum WorkflowExecutionSearchableField {
  startTime = 'startTime',
  endTime = 'endTime',
  workflowId = 'workflowId',
  workflowType = 'workflowType',
  status = 'status',
}

export class SearchWorkflowExecutionsOrderDto {
  @ApiProperty({
    description: '排序的字段',
    enum: WorkflowExecutionSearchableField,
    required: true,
  })
  @Joiful.string()
    .allow(
      WorkflowExecutionSearchableField.startTime,
      WorkflowExecutionSearchableField.endTime,
      WorkflowExecutionSearchableField.workflowId,
      WorkflowExecutionSearchableField.workflowType,
      WorkflowExecutionSearchableField.status,
    )
    .required()
  field: WorkflowExecutionSearchableField;

  @ApiProperty({
    description: '排序的字段',
    enum: OrderBy,
    required: true,
  })
  @Joiful.string().allow(OrderBy.ASC, OrderBy.DESC).required()
  order: OrderBy;
}

export class SearchWorkflowExecutionsDto {
  @ApiProperty({
    description: '模糊查询',
    required: false,
    type: String,
    default: '*',
  })
  @Joiful.string()
  freeText: string;

  @ApiProperty({
    description: '根据 workflow ID 进行筛选',
    required: false,
    type: String,
  })
  @Joiful.string()
  workflowId: string;

  @ApiProperty({
    description: '根据 workflow 执行 ID 进行筛选',
    required: false,
    type: String,
  })
  @Joiful.string()
  workflowInstanceId: string;

  @ApiProperty({
    description: '根据创建用户 ID 进行筛选',
    required: false,
    type: String,
  })
  @Joiful.string()
  creatorUserId: string;

  @ApiProperty({
    description: '工作流版本号',
    required: false,
    type: String,
    isArray: true,
  })
  versions: string[];

  @ApiProperty({
    description: '工作流状态',
    enum: WorkflowStatusEnum,
    required: false,
    isArray: true,
  })
  @Joiful.array().items((joi) => joi.string())
  status: WorkflowStatusEnum[];

  @ApiProperty({
    description: '工作流触发方式',
    enum: WorkflowTriggerType,
    required: false,
    isArray: true,
  })
  @Joiful.array().items((joi) => joi.string())
  triggerTypes: WorkflowTriggerType[];

  @ApiProperty({
    description: '启动工作流的用户 ID，支持同时传多个用户',
    type: String,
    required: false,
    isArray: true,
  })
  @Joiful.array().items((joi) => joi.string())
  startBy: string[];

  @ApiProperty({
    description: '执行开始时间（毫秒时间戳）',
    type: Number,
    required: false,
  })
  @Joiful.number()
  startTimeFrom: number;

  @ApiProperty({
    description: '执行结束时间（毫秒时间戳）',
    type: Number,
    required: false,
  })
  @Joiful.number()
  startTimeTo: number;

  @ApiProperty({
    description: '分页配置',
    type: () => PaginationDto,
    required: false,
    example: {
      page: 1,
      limit: 10,
    },
  })
  @Joiful.object()
  pagination: PaginationDto;

  @ApiProperty({
    description: '按照时间排序规则',
    type: () => SearchWorkflowExecutionsOrderDto,
    required: false,
    example: {
      field: WorkflowExecutionSearchableField.startTime,
      order: OrderBy.DESC,
    },
  })
  @Joiful.object()
  orderBy: SearchWorkflowExecutionsOrderDto;

  @ApiProperty({
    description: 'Chat Session Id 列表',
    type: String,
    required: false,
    isArray: true,
  })
  chatSessionIds?: string[];

  @ApiProperty({
    description: '分组列表',
    type: String,
    required: false,
    isArray: true,
  })
  groups?: string[];

  @ApiProperty({
    description: '额外元数据',
    type: Object,
    required: false,
  })
  extraMetadata?: Record<string, any>;
}
