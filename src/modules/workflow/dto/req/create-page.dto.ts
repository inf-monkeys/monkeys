import { WorkflowPageEntity } from '@/entities/workflow/workflow-page';
import { ApiProperty } from '@nestjs/swagger';
import * as joiful from 'joiful';

export class CreatePageDto {
  @ApiProperty({
    name: 'type',
    description: '类型',
    type: String,
    enum: ['process', 'log', 'chat', 'preview', 'api'],
  })
  @joiful.string().allow(['process', 'log', 'chat', 'preview', 'api']).required()
  type: WorkflowPageEntity['type'];

  @ApiProperty({
    name: 'permissions',
    description: '权限',
    type: String,
    isArray: true,
    enum: ['read', 'write', 'exec', 'permission'],
  })
  @joiful
    .array()
    .items((joi) => joi.string())
    .allow(['read', 'write', 'exec', 'permission'])
  permissions: WorkflowPageEntity['permissions'];

  @ApiProperty({
    name: 'displayName',
    description: '页面名称',
    type: String,
  })
  @joiful.string()
  displayName: string;

  @ApiProperty({
    name: 'sortIndex',
    description: '序号（越小越靠前）',
    type: String,
  })
  @joiful.number()
  sortIndex?: number;

  @ApiProperty({
    name: 'customOptions',
    description: '自定义配置项',
    type: Object,
  })
  @joiful.object()
  customOptions?: Record<string, unknown>;
}
