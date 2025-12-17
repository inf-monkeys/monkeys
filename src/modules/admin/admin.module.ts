import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminAuthService } from './auth/admin-auth.service';
import { AdminUserRepository } from '@/database/repositories/admin-user.repository';
import { AdminRoleRepository } from '@/database/repositories/admin-role.repository';
import { AdminPermissionRepository } from '@/database/repositories/admin-permission.repository';
import { AdminUserEntity } from '@/database/entities/admin/admin-user.entity';
import { AdminRoleEntity } from '@/database/entities/admin/admin-role.entity';
import { AdminPermissionEntity } from '@/database/entities/admin/admin-permission.entity';
import { AdminTokenGuard } from './guards/admin-token.guard';
import { AdminJwtGuard } from './guards/admin-jwt.guard';
import { AdminPermissionsGuard } from './guards/admin-permissions.guard';
import { DataManagementModule } from './data-management/data-management.module';
import { AdminUserManagementController } from './user-management/admin-user-management.controller';
import { AdminUserManagementService } from './user-management/admin-user-management.service';
import { UserManagementController } from './user-management/user-management.controller';
import { UserManagementService } from './user-management/user-management.service';
import { UserEntity } from '@/database/entities/identity/user';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminUserEntity,
      AdminRoleEntity,
      AdminPermissionEntity,
      UserEntity,
    ]),
    DataManagementModule,
  ],
  controllers: [AdminAuthController, AdminUserManagementController, UserManagementController],
  providers: [
    AdminAuthService,
    AdminUserRepository,
    AdminRoleRepository,
    AdminPermissionRepository,
    AdminTokenGuard,
    AdminJwtGuard,
    AdminPermissionsGuard,
    AdminUserManagementService,
    UserManagementService,
  ],
  exports: [AdminAuthService],
})
export class AdminModule {}
