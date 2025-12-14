import { Column, Entity } from 'typeorm';
import { AdminBaseEntity } from '../admin/admin-base.entity';

/**
 * 数据视图实体
 * 用于组织和分类数据资产，支持树形结构和筛选配置
 *
 * 注意：索引通过 migration 管理，不在 entity 中定义
 * 参见：1734200000000-AddDataManagementIndexes.ts
 */
@Entity({ name: 'data_views' })
export class DataViewEntity extends AdminBaseEntity {
  @Column({
    name: 'name',
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: '视图名称',
  })
  name: string;

  @Column({
    name: 'description',
    type: 'text',
    nullable: true,
    comment: '视图描述',
  })
  description?: string;

  @Column({
    name: 'icon_url',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '视图图标 URL',
  })
  iconUrl?: string;

  // ========== 树形结构相关 ==========

  @Column({
    name: 'parent_id',
    type: 'varchar',
    length: 128,
    nullable: true,
    comment: '父视图 ID，null 表示根视图',
  })
  parentId?: string;

  @Column({
    name: 'path',
    type: 'varchar',
    length: 1000,
    nullable: false,
    comment: '视图路径，如 /1/2/3，用于快速查询子树',
  })
  path: string;

  @Column({
    name: 'level',
    type: 'int',
    nullable: false,
    default: 0,
    comment: '视图层级，0 表示根节点',
  })
  level: number;

  @Column({
    name: 'sort',
    type: 'int',
    nullable: false,
    default: 0,
    comment: '同级排序序号',
  })
  sort: number;

  // ========== 筛选配置 ==========

  @Column({
    name: 'filter_config',
    type: 'json',
    nullable: true,
    comment: '筛选条件配置',
  })
  filterConfig?: {
    conditions: Array<{
      field: string; // 筛选字段
      operator: 'eq' | 'neq' | 'in' | 'nin' | 'contains' | 'between' | 'gt' | 'gte' | 'lt' | 'lte';
      value: any; // 筛选值
    }>;
    logic: 'AND' | 'OR'; // 多条件逻辑
  };

  // ========== 显示配置 ==========

  @Column({
    name: 'display_config',
    type: 'json',
    nullable: true,
    comment: '显示配置',
  })
  displayConfig?: {
    columns?: string[]; // 要显示的列
    defaultSort?: {
      field: string;
      order: 'asc' | 'desc';
    };
    pageSize?: number; // 默认每页数量
  };

  // ========== 权限相关 ==========

  @Column({
    name: 'creator_user_id',
    type: 'varchar',
    length: 128,
    nullable: false,
    comment: '创建者用户 ID',
  })
  creatorUserId: string;

  @Column({
    name: 'team_id',
    type: 'varchar',
    length: 128,
    nullable: true,
    comment: '所属团队 ID',
  })
  teamId?: string;

  @Column({
    name: 'is_public',
    type: 'boolean',
    default: false,
    comment: '是否公开',
  })
  isPublic: boolean;

  // ========== 统计信息 ==========

  @Column({
    name: 'asset_count',
    type: 'int',
    default: 0,
    comment: '包含的资产数量（仅直接子资产，不含子视图的资产）',
  })
  assetCount: number;
}
