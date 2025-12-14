import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class AddDataManagementIndexes1734200000000 implements MigrationInterface {
  name = 'AddDataManagementIndexes1734200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // data_views 表索引
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_data_views_parent_id_is_deleted" ON "${appId}_data_views" ("parent_id", "is_deleted")`);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_data_views_team_id_is_public_is_deleted" ON "${appId}_data_views" ("team_id", "is_public", "is_deleted")`);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_data_views_is_deleted_created_timestamp" ON "${appId}_data_views" ("is_deleted", "created_timestamp")`);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_data_views_path" ON "${appId}_data_views" ("path")`);

    // data_assets 表索引
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_data_assets_view_id_is_deleted_status" ON "${appId}_data_assets" ("view_id", "is_deleted", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_data_assets_team_id_is_deleted_status" ON "${appId}_data_assets" ("team_id", "is_deleted", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_data_assets_status_is_deleted_created_timestamp" ON "${appId}_data_assets" ("status", "is_deleted", "created_timestamp")`);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_data_assets_creator_user_id_is_deleted" ON "${appId}_data_assets" ("creator_user_id", "is_deleted")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // data_assets 表索引
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_data_assets_creator_user_id_is_deleted"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_data_assets_status_is_deleted_created_timestamp"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_data_assets_team_id_is_deleted_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_data_assets_view_id_is_deleted_status"`);

    // data_views 表索引
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_data_views_path"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_data_views_is_deleted_created_timestamp"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_data_views_team_id_is_public_is_deleted"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_data_views_parent_id_is_deleted"`);
  }
}
