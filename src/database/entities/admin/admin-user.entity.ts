import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { AdminBaseEntity } from './admin-base.entity';
import { AdminRoleEntity } from './admin-role.entity';

@Entity('admin_users')
export class AdminUserEntity extends AdminBaseEntity {
  @Column({ unique: true })
  username: string;

  @Column()
  password: string; // bcrypt 加密

  @Column()
  name: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  photo?: string;

  @Column({
    name: 'last_login_at',
    nullable: true,
    type: 'bigint',
  })
  lastLoginAt?: number;

  @Column({ name: 'logins_count', default: 0 })
  loginsCount: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string; // 创建者的 admin user id

  // 多对多关系：一个用户可以有多个角色
  @ManyToMany(() => AdminRoleEntity, (role) => role.users, { eager: true })
  @JoinTable({
    name: 'admin_user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: AdminRoleEntity[];
}
