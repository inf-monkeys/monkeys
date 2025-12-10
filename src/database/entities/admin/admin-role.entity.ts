import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { AdminBaseEntity } from './admin-base.entity';
import { AdminPermissionEntity } from './admin-permission.entity';
import { AdminUserEntity } from './admin-user.entity';

@Entity('admin_roles')
export class AdminRoleEntity extends AdminBaseEntity {
  @Column({ unique: true })
  code: string; // 'super_admin', 'admin'

  @Column()
  name: string; // '超级管理员', '管理员'

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'is_system', default: false })
  isSystem: boolean; // 系统角色不可删除

  // 多对多：角色 -> 用户
  @ManyToMany(() => AdminUserEntity, (user) => user.roles)
  users: AdminUserEntity[];

  // 多对多：角色 -> 权限
  @ManyToMany(() => AdminPermissionEntity, (permission) => permission.roles, {
    eager: true,
  })
  @JoinTable({
    name: 'admin_role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: AdminPermissionEntity[];
}
