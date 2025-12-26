import { Module } from '@nestjs/common';
import { DataManagementV2Service } from './data-management-v2.service';
import { MonkeyDataClient } from './monkey-data.client';
import { DataAssetV2Controller } from './data-asset-v2.controller';
import { DataViewV2Controller } from './data-view-v2.controller';
import { DataTagV2Controller } from './data-tag-v2.controller';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { AdminAuthService } from '../auth/admin-auth.service';
import { AdminUserRepository } from '@/database/repositories/admin-user.repository';
import { AdminRoleRepository } from '@/database/repositories/admin-role.repository';

@Module({
  controllers: [DataAssetV2Controller, DataViewV2Controller, DataTagV2Controller],
  providers: [
    DataManagementV2Service,
    MonkeyDataClient,
    AdminJwtGuard,
    AdminAuthService,
    AdminUserRepository,
    AdminRoleRepository,
  ],
  exports: [DataManagementV2Service],
})
export class DataManagementV2Module {}
