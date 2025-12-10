import { Column, Entity, ManyToMany } from 'typeorm';
import { AdminBaseEntity } from './admin-base.entity';
import { AdminRoleEntity } from './admin-role.entity';

@Entity('admin_permissions')
export class AdminPermissionEntity extends AdminBaseEntity {
  @Column({ unique: true })
  code: string; // 'user:read', 'user:write', 'team:delete'

  @Column()
  name: string; // '查看用户', '编辑用户', '删除团队'

  @Column()
  resource: string; // 'user', 'team', 'tool', 'config'

  @Column()
  action: string; // 'read', 'write', 'delete', 'manage'

  @Column({ type: 'text', nullable: true })
  description?: string;

  // 多对多：权限 -> 角色
  @ManyToMany(() => AdminRoleEntity, (role) => role.permissions)
  roles: AdminRoleEntity[];
}
