import { WorkflowPageEntity } from '@/database/entities/workflow/workflow-page';
import { ApiProperty } from '@nestjs/swagger';
import * as joiful from 'joiful';

interface UpdatePageData {
  pageId: string;
  permissions?: WorkflowPageEntity['permissions'];
  displayName?: string;
  sortIndex?: number;
  customOptions?: Record<string, unknown>;
}

export class UpdatePagesDto {
  @ApiProperty({
    name: 'pages',
    description: '要更新的页面信息',
    type: Object,
    isArray: true,
    example: {
      pageId: '6561ed83a60ba37fee5c6e14',
      permissions: ['read', 'write'],
      displayName: '新页面名称',
      sortIndex: 1,
      customOptions: {},
    },
  })
  @joiful.array().items((joi) => joi.object())
  pages: UpdatePageData[];
}

export class UpdatePageGroupDto {
  @ApiProperty({
    name: 'displayName',
    description: '分组名称',
    type: String,
    example: '分组名称',
  })
  @joiful.string()
  displayName?: string;

  @ApiProperty({
    name: 'pageId',
    description: '页面 ID',
    type: String,
    example: '6561ed83a60ba37fee5c6e14',
  })
  pageId?: string;

  @ApiProperty({
    name: 'mode',
    description: '操作类型',
    type: String,
    example: 'add',
  })
  mode?: 'add' | 'remove';

  @ApiProperty({
    name: 'iconUrl',
    description: '分组图标',
    type: String,
    example: 'https://example.com/icon.png',
  })
  iconUrl?: string;
}
