import { WorkflowPageEntity } from '@/entities/workflow/workflow-page';
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
