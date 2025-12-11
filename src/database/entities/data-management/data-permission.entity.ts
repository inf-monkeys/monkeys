import { Column, Entity } from 'typeorm';
import { AdminBaseEntity } from '../admin/admin-base.entity';

export type PermissionType = 'read' | 'write' | 'delete' | 'admin';

/**
 * 数据视图权限关联表
 */
@Entity({ name: 'data_view_permissions' })
export class DataViewPermissionEntity extends AdminBaseEntity {
  @Column({
    name: 'view_id',
    type: 'varchar',
    length: 128,
    nullable: false,
    comment: '视图 ID',
  })
  viewId: string;

  @Column({
    name: 'user_id',
    type: 'varchar',
    length: 128,
    nullable: true,
    comment: '用户 ID（与 role_id 二选一）',
  })
  userId?: string;

  @Column({
    name: 'role_id',
    type: 'varchar',
    length: 128,
    nullable: true,
    comment: '角色 ID（与 user_id 二选一）',
  })
  roleId?: string;

  @Column({
    name: 'permission',
    type: 'varchar',
    length: 20,
    nullable: false,
    comment: '权限类型：read/write/delete/admin',
  })
  permission: PermissionType;
}

/**
 * 数据资产权限关联表
 */
@Entity({ name: 'data_asset_permissions' })
export class DataAssetPermissionEntity extends AdminBaseEntity {
  @Column({
    name: 'asset_id',
    type: 'varchar',
    length: 128,
    nullable: false,
    comment: '资产 ID',
  })
  assetId: string;

  @Column({
    name: 'user_id',
    type: 'varchar',
    length: 128,
    nullable: true,
    comment: '用户 ID（与 role_id 二选一）',
  })
  userId?: string;

  @Column({
    name: 'role_id',
    type: 'varchar',
    length: 128,
    nullable: true,
    comment: '角色 ID（与 user_id 二选一）',
  })
  roleId?: string;

  @Column({
    name: 'permission',
    type: 'varchar',
    length: 20,
    nullable: false,
    comment: '权限类型：read/write/delete/admin',
  })
  permission: PermissionType;
}
