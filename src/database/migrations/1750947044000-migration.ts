import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

const marketplaceAppVersionsStatusEnum = `${appId}_marketplace_app_versions_status_enum`;
const marketplaceAppVersionsTable = `${appId}_marketplace_app_versions`;
const marketplaceAppVersionsTablePK = `PK_${appId}_9f54fef467290879d7a876ca115`;
const marketplaceAppVersionsTableIDX1 = `IDX_${appId}_6750d4b8e6b81434689477f3d1`;
const marketplaceAppVersionsTableIDX2 = `IDX_${appId}_76447c217f5455f26b41e603cb`;

const marketplaceAppsStatusEnum = `${appId}_marketplace_apps_status_enum`;
const marketplaceAppsTable = `${appId}_marketplace_apps`;
const marketplaceAppsTablePK = `PK_${appId}_59b603d1b223364620152602cfa`;
const marketplaceAppsTableIDX1 = `IDX_${appId}_d025eab43f675bef2cdaad36a5`;
const marketplaceAppsTableIDX2 = `IDX_${appId}_442a4eb5e57ff71c05cf1d05d5`;
const marketplaceAppsTableIDX3 = `IDX_${appId}_4f3e01bd331ec4b1b3241c8cbc`;

const installedAppsTable = `${appId}_installed_apps`;
const installedAppsTablePK = `PK_${appId}_40aa97573ef6bbcaada61166a47`;
const installedAppsTableIDX1 = `IDX_${appId}_eae2d553cd6474d78ab57cd295`;
const installedAppsTableIDX2 = `IDX_${appId}_123ed0b640eb5546e126dca337`;
const installedAppsTableIDX3 = `IDX_${appId}_a4c7ff66a6588cb5a745601913`;
const installedAppsTableIDX4 = `IDX_${appId}_82038f3b7ca70ae895575d4b63`;

const marketplaceAppVersionTableFK = `FK_${appId}_6750d4b8e6b81434689477f3d1f`;

const usersTable = `${appId}_users`;

export class Migration1750947044000 implements MigrationInterface {
  name = 'Migration1750947044000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."${marketplaceAppVersionsStatusEnum}" AS ENUM('ACTIVE', 'DEPRECATED')`);
    await queryRunner.query(
      `CREATE TABLE "${marketplaceAppVersionsTable}" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "app_id" character varying NOT NULL, "version" character varying NOT NULL, "release_notes" text, "asset_snapshot" jsonb NOT NULL, "source_asset_references" jsonb, "status" "public"."${marketplaceAppVersionsStatusEnum}" NOT NULL DEFAULT 'ACTIVE', CONSTRAINT "${marketplaceAppVersionsTablePK}" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "${marketplaceAppVersionsTableIDX1}" ON "${marketplaceAppVersionsTable}" ("app_id") `);
    await queryRunner.query(`CREATE INDEX "${marketplaceAppVersionsTableIDX2}" ON "${marketplaceAppVersionsTable}" ("status") `);
    await queryRunner.query(`CREATE TYPE "public"."${marketplaceAppsStatusEnum}" AS ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ARCHIVED')`);
    await queryRunner.query(
      `CREATE TABLE "${marketplaceAppsTable}" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying NOT NULL, "description" text, "icon_url" character varying, "asset_type" character varying NOT NULL, "author_team_id" character varying NOT NULL, "status" "public"."${marketplaceAppsStatusEnum}" NOT NULL DEFAULT 'PENDING_APPROVAL', "categories" text, "total_installs" integer NOT NULL DEFAULT '0', CONSTRAINT "${marketplaceAppsTablePK}" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "${marketplaceAppsTableIDX1}" ON "${marketplaceAppsTable}" ("asset_type") `);
    await queryRunner.query(`CREATE INDEX "${marketplaceAppsTableIDX2}" ON "${marketplaceAppsTable}" ("author_team_id") `);
    await queryRunner.query(`CREATE INDEX "${marketplaceAppsTableIDX3}" ON "${marketplaceAppsTable}" ("status") `);
    await queryRunner.query(
      `CREATE TABLE "${installedAppsTable}" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "user_id" character varying NOT NULL, "installed_asset_ids" jsonb NOT NULL, "marketplace_app_version_id" character varying NOT NULL, "is_update_available" boolean NOT NULL DEFAULT false, CONSTRAINT "${installedAppsTablePK}" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "${installedAppsTableIDX1}" ON "${installedAppsTable}" ("team_id") `);
    await queryRunner.query(`CREATE INDEX "${installedAppsTableIDX2}" ON "${installedAppsTable}" ("installed_asset_ids") `);
    await queryRunner.query(`CREATE INDEX "${installedAppsTableIDX3}" ON "${installedAppsTable}" ("marketplace_app_version_id") `);
    await queryRunner.query(`CREATE INDEX "${installedAppsTableIDX4}" ON "${installedAppsTable}" ("is_update_available") `);
    await queryRunner.query(`ALTER TABLE "${usersTable}" ADD "is_admin" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(
      `ALTER TABLE "${marketplaceAppVersionsTable}" ADD CONSTRAINT "${marketplaceAppVersionTableFK}" FOREIGN KEY ("app_id") REFERENCES "${marketplaceAppsTable}"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${marketplaceAppVersionsTable}" DROP CONSTRAINT "${marketplaceAppVersionTableFK}"`);
    await queryRunner.query(`ALTER TABLE "${usersTable}" DROP COLUMN "is_admin"`);
    await queryRunner.query(`DROP INDEX "public"."${installedAppsTableIDX4}"`);
    await queryRunner.query(`DROP INDEX "public"."${installedAppsTableIDX3}"`);
    await queryRunner.query(`DROP INDEX "public"."${installedAppsTableIDX2}"`);
    await queryRunner.query(`DROP INDEX "public"."${installedAppsTableIDX1}"`);
    await queryRunner.query(`DROP TABLE "${installedAppsTable}"`);
    await queryRunner.query(`DROP INDEX "public"."${marketplaceAppsTableIDX3}"`);
    await queryRunner.query(`DROP INDEX "public"."${marketplaceAppsTableIDX2}"`);
    await queryRunner.query(`DROP INDEX "public"."${marketplaceAppsTableIDX1}"`);
    await queryRunner.query(`DROP TABLE "${marketplaceAppsTable}"`);
    await queryRunner.query(`DROP TYPE "public"."${marketplaceAppsStatusEnum}"`);
    await queryRunner.query(`DROP INDEX "public"."${marketplaceAppVersionsTableIDX2}"`);
    await queryRunner.query(`DROP INDEX "public"."${marketplaceAppVersionsTableIDX1}"`);
    await queryRunner.query(`DROP TABLE "${marketplaceAppVersionsTable}"`);
    await queryRunner.query(`DROP TYPE "public"."${marketplaceAppVersionsStatusEnum}"`);
  }
}
