import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../base/base';
import { PageInstanceType } from './workflow-page';

/**
 * 全局「内置应用」工作台固定视图配置
 *
 * 设计说明：
 * - 不与具体的 workflow_pages / workflow_page_group 绑定
 * - 仅记录 workflowId + 视图类型（pageType），以及可选的分组 key 和排序
 * - 在 getPinnedPages 时按需解析为虚拟的 pinned 视图，注入到各团队的默认分组中
 */
@Entity({ name: 'workflow_builtin_pinned_pages' })
export class WorkflowBuiltinPinnedPageEntity extends BaseEntity {
  @Column({
    name: 'workflow_id',
    type: 'varchar',
  })
  workflowId: string;

  @Column({
    name: 'page_type',
    type: 'varchar',
  })
  pageType: PageInstanceType;

  @Column({
    name: 'group_key',
    type: 'varchar',
    nullable: true,
  })
  groupKey?: string | null;

  @Column({
    name: 'sort_index',
    type: 'integer',
    nullable: true,
  })
  sortIndex?: number | null;
}


