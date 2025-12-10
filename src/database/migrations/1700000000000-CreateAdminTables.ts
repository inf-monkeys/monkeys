import { config } from '@/common/config';
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

const appId = config.server.appId;

export class CreateAdminTables1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 创建 admin_users 表
    await queryRunner.createTable(
      new Table({
        name: `${appId}_admin_users`,
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'username',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'password',
            type: 'varchar',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'email',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'photo',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'last_login_at',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'logins_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_by',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_timestamp',
            type: 'bigint',
          },
          {
            name: 'updated_timestamp',
            type: 'bigint',
          },
          {
            name: 'is_deleted',
            type: 'boolean',
            default: false,
          },
        ],
        indices: [
          {
            name: `IDX_${appId}_ADMIN_USERS_USERNAME`,
            columnNames: ['username'],
          },
          {
            name: `IDX_${appId}_ADMIN_USERS_IS_ACTIVE`,
            columnNames: ['is_active'],
          },
          {
            name: `IDX_${appId}_ADMIN_USERS_IS_DELETED`,
            columnNames: ['is_deleted'],
          },
        ],
      }),
      true
    );

    // 2. 创建 admin_roles 表
    await queryRunner.createTable(
      new Table({
        name: `${appId}_admin_roles`,
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'code',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_system',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_timestamp',
            type: 'bigint',
          },
          {
            name: 'updated_timestamp',
            type: 'bigint',
          },
          {
            name: 'is_deleted',
            type: 'boolean',
            default: false,
          },
        ],
        indices: [
          {
            name: `IDX_${appId}_ADMIN_ROLES_CODE`,
            columnNames: ['code'],
          },
          {
            name: `IDX_${appId}_ADMIN_ROLES_IS_DELETED`,
            columnNames: ['is_deleted'],
          },
        ],
      }),
      true
    );

    // 3. 创建 admin_permissions 表
    await queryRunner.createTable(
      new Table({
        name: `${appId}_admin_permissions`,
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'code',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'resource',
            type: 'varchar',
          },
          {
            name: 'action',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_timestamp',
            type: 'bigint',
          },
          {
            name: 'updated_timestamp',
            type: 'bigint',
          },
          {
            name: 'is_deleted',
            type: 'boolean',
            default: false,
          },
        ],
        indices: [
          {
            name: `IDX_${appId}_ADMIN_PERMISSIONS_CODE`,
            columnNames: ['code'],
          },
          {
            name: `IDX_${appId}_ADMIN_PERMISSIONS_RESOURCE`,
            columnNames: ['resource'],
          },
          {
            name: `IDX_${appId}_ADMIN_PERMISSIONS_IS_DELETED`,
            columnNames: ['is_deleted'],
          },
        ],
      }),
      true
    );

    // 4. 创建 admin_user_roles 关联表
    await queryRunner.createTable(
      new Table({
        name: `${appId}_admin_user_roles`,
        columns: [
          {
            name: 'user_id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'role_id',
            type: 'varchar',
            isPrimary: true,
          },
        ],
      }),
      true
    );

    // 5. 创建 admin_role_permissions 关联表
    await queryRunner.createTable(
      new Table({
        name: `${appId}_admin_role_permissions`,
        columns: [
          {
            name: 'role_id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'permission_id',
            type: 'varchar',
            isPrimary: true,
          },
        ],
      }),
      true
    );

    // 6. 创建外键关系
    await queryRunner.createForeignKeys(`${appId}_admin_user_roles`, [
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: `${appId}_admin_users`,
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['role_id'],
        referencedTableName: `${appId}_admin_roles`,
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createForeignKeys(`${appId}_admin_role_permissions`, [
      new TableForeignKey({
        columnNames: ['role_id'],
        referencedTableName: `${appId}_admin_roles`,
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['permission_id'],
        referencedTableName: `${appId}_admin_permissions`,
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);

    // 7. 插入初始角色数据
    const timestamp = Date.now();
    await queryRunner.query(`
      INSERT INTO "${appId}_admin_roles" (id, code, name, description, is_system, created_timestamp, updated_timestamp, is_deleted)
      VALUES
        ('role-super-admin', 'super_admin', '超级管理员', '拥有所有权限', true, ${timestamp}, ${timestamp}, false),
        ('role-admin', 'admin', '管理员', '基础管理权限', true, ${timestamp}, ${timestamp}, false)
    `);

    // 8. 插入初始权限数据
    const permissions = [
      // 用户管理
      { code: 'user:read', name: '查看用户', resource: 'user', action: 'read', description: '查看平台用户列表和详情' },
      { code: 'user:write', name: '编辑用户', resource: 'user', action: 'write', description: '创建和编辑用户信息' },
      { code: 'user:delete', name: '删除用户', resource: 'user', action: 'delete', description: '删除用户账号' },
      // 团队管理
      { code: 'team:read', name: '查看团队', resource: 'team', action: 'read', description: '查看团队列表和详情' },
      { code: 'team:write', name: '编辑团队', resource: 'team', action: 'write', description: '创建和编辑团队' },
      { code: 'team:delete', name: '删除团队', resource: 'team', action: 'delete', description: '删除团队' },
      // 工具管理
      { code: 'tool:read', name: '查看工具', resource: 'tool', action: 'read', description: '查看工具列表和配置' },
      { code: 'tool:write', name: '编辑工具', resource: 'tool', action: 'write', description: '配置和管理工具' },
      { code: 'tool:delete', name: '删除工具', resource: 'tool', action: 'delete', description: '删除工具' },
      // 工作流管理
      { code: 'workflow:read', name: '查看工作流', resource: 'workflow', action: 'read', description: '查看工作流列表' },
      { code: 'workflow:write', name: '编辑工作流', resource: 'workflow', action: 'write', description: '创建和编辑工作流' },
      { code: 'workflow:delete', name: '删除工作流', resource: 'workflow', action: 'delete', description: '删除工作流' },
      // 资产管理
      { code: 'asset:read', name: '查看资产', resource: 'asset', action: 'read', description: '查看资产列表' },
      { code: 'asset:write', name: '编辑资产', resource: 'asset', action: 'write', description: '管理资产' },
      { code: 'asset:delete', name: '删除资产', resource: 'asset', action: 'delete', description: '删除资产' },
      // 配置管理
      { code: 'config:read', name: '查看配置', resource: 'config', action: 'read', description: '查看系统配置' },
      { code: 'config:write', name: '编辑配置', resource: 'config', action: 'write', description: '修改系统配置' },
      // 管理员管理
      { code: 'admin:read', name: '查看管理员', resource: 'admin', action: 'read', description: '查看管理员列表' },
      { code: 'admin:write', name: '编辑管理员', resource: 'admin', action: 'write', description: '创建和编辑管理员' },
      { code: 'admin:delete', name: '删除管理员', resource: 'admin', action: 'delete', description: '删除管理员账号' },
      // 任务管理
      { code: 'task:read', name: '查看任务', resource: 'task', action: 'read', description: '查看任务执行记录' },
      { code: 'task:manage', name: '管理任务', resource: 'task', action: 'manage', description: '管理和操作任务' },
      // 计费管理
      { code: 'billing:read', name: '查看计费', resource: 'billing', action: 'read', description: '查看计费记录' },
      { code: 'billing:write', name: '管理计费', resource: 'billing', action: 'write', description: '管理计费和充值' },
    ];

    const permissionInserts = permissions.map((perm, index) => {
      const id = `perm-${perm.code.replace(':', '-')}`;
      return `('${id}', '${perm.code}', '${perm.name}', '${perm.resource}', '${perm.action}', '${perm.description}', ${timestamp}, ${timestamp}, false)`;
    }).join(',\n      ');

    await queryRunner.query(`
      INSERT INTO "${appId}_admin_permissions" (id, code, name, resource, action, description, created_timestamp, updated_timestamp, is_deleted)
      VALUES
      ${permissionInserts}
    `);

    // 9. 给 super_admin 角色分配所有权限
    const allPermissionIds = permissions.map(perm => `perm-${perm.code.replace(':', '-')}`);
    const superAdminPermissions = allPermissionIds.map(id => `('role-super-admin', '${id}')`).join(',\n      ');

    await queryRunner.query(`
      INSERT INTO "${appId}_admin_role_permissions" (role_id, permission_id)
      VALUES
      ${superAdminPermissions}
    `);

    // 10. 给 admin 角色分配基础查看权限
    const adminPermissions = [
      'user:read',
      'team:read',
      'tool:read',
      'workflow:read',
      'asset:read',
      'config:read',
      'task:read',
      'billing:read',
    ];
    const adminPermissionInserts = adminPermissions.map(code => {
      const id = `perm-${code.replace(':', '-')}`;
      return `('role-admin', '${id}')`;
    }).join(',\n      ');

    await queryRunner.query(`
      INSERT INTO "${appId}_admin_role_permissions" (role_id, permission_id)
      VALUES
      ${adminPermissionInserts}
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除外键
    const adminUserRolesTable = await queryRunner.getTable(`${appId}_admin_user_roles`);
    const adminRolePermissionsTable = await queryRunner.getTable(`${appId}_admin_role_permissions`);

    if (adminUserRolesTable) {
      const foreignKeys = adminUserRolesTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey(`${appId}_admin_user_roles`, fk);
      }
    }

    if (adminRolePermissionsTable) {
      const foreignKeys = adminRolePermissionsTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey(`${appId}_admin_role_permissions`, fk);
      }
    }

    // 删除表
    await queryRunner.dropTable(`${appId}_admin_role_permissions`, true);
    await queryRunner.dropTable(`${appId}_admin_user_roles`, true);
    await queryRunner.dropTable(`${appId}_admin_permissions`, true);
    await queryRunner.dropTable(`${appId}_admin_roles`, true);
    await queryRunner.dropTable(`${appId}_admin_users`, true);
  }
}
