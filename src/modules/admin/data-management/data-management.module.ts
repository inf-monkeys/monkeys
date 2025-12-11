import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataViewEntity } from '@/database/entities/data-management/data-view.entity';
import { DataAssetEntity } from '@/database/entities/data-management/data-asset.entity';
import {
  DataViewPermissionEntity,
  DataAssetPermissionEntity,
} from '@/database/entities/data-management/data-permission.entity';
import { DataViewRepository } from '@/database/repositories/data-view.repository';
import { DataAssetRepository } from '@/database/repositories/data-asset.repository';
import {
  DataViewPermissionRepository,
  DataAssetPermissionRepository,
} from '@/database/repositories/data-permission.repository';
import { DataViewService } from './data-view.service';
import { DataViewController } from './data-view.controller';
import { DataAssetService } from './data-asset.service';
import { DataAssetController } from './data-asset.controller';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { AdminAuthService } from '../auth/admin-auth.service';
import { AdminUserRepository } from '@/database/repositories/admin-user.repository';
import { AdminRoleRepository } from '@/database/repositories/admin-role.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DataViewEntity,
      DataAssetEntity,
      DataViewPermissionEntity,
      DataAssetPermissionEntity,
    ]),
  ],
  controllers: [DataViewController, DataAssetController],
  providers: [
    DataViewService,
    DataAssetService,
    DataViewRepository,
    DataAssetRepository,
    DataViewPermissionRepository,
    DataAssetPermissionRepository,
    AdminJwtGuard,
    AdminAuthService,
    AdminUserRepository,
    AdminRoleRepository,
  ],
  exports: [DataViewService, DataAssetService],
})
export class DataManagementModule {}
