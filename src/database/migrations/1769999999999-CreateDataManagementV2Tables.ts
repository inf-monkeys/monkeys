import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class CreateDataManagementV2Tables1769999999999 implements MigrationInterface {
  name = 'CreateDataManagementV2Tables1769999999999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========== data_assets_v2 ==========
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "${appId}_data_assets_v2" (
        "id" varchar(128) PRIMARY KEY,
        "team_id" varchar(128) NOT NULL,
        "creator_user_id" varchar(128),
        "name" varchar(500) NOT NULL,
        "asset_type" varchar(50) NOT NULL,
        "primary_content" jsonb NOT NULL,
        "properties" jsonb,
        "files" jsonb,
        "media" varchar(500),
        "thumbnail" varchar(500),
        "keywords" text,
        "status" varchar(20) NOT NULL DEFAULT 'draft',
        "extra" jsonb,
        "created_timestamp" bigint NOT NULL DEFAULT FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000),
        "updated_timestamp" bigint NOT NULL DEFAULT FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000),
        "is_deleted" boolean NOT NULL DEFAULT false
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_data_assets_v2_team_updated"
      ON "${appId}_data_assets_v2" ("team_id", "updated_timestamp" DESC, "id" DESC)
    `);

    // ========== data_tags_v2 ==========
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "${appId}_data_tags_v2" (
        "id" varchar(128) PRIMARY KEY,
        "team_id" varchar(128) NOT NULL,
        "name" varchar(255) NOT NULL,
        "name_norm" varchar(255) NOT NULL,
        "color" varchar(50),
        "extra" jsonb,
        "created_timestamp" bigint NOT NULL DEFAULT FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000),
        "updated_timestamp" bigint NOT NULL DEFAULT FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000),
        "is_deleted" boolean NOT NULL DEFAULT false
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_data_tags_v2_team_norm"
      ON "${appId}_data_tags_v2" ("team_id", "name_norm")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_data_tags_v2_team_name"
      ON "${appId}_data_tags_v2" ("team_id", "name")
    `);

    // ========== data_asset_tag_relations_v2 ==========
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "${appId}_data_asset_tag_relations_v2" (
        "id" varchar(128) PRIMARY KEY,
        "team_id" varchar(128) NOT NULL,
        "asset_id" varchar(128) NOT NULL,
        "tag_id" varchar(128) NOT NULL,
        "created_timestamp" bigint NOT NULL DEFAULT FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000),
        "updated_timestamp" bigint NOT NULL DEFAULT FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000),
        "is_deleted" boolean NOT NULL DEFAULT false
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "ux_${appId}_data_asset_tag_relations_v2"
      ON "${appId}_data_asset_tag_relations_v2" ("team_id", "asset_id", "tag_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_data_asset_tag_relations_v2_tag"
      ON "${appId}_data_asset_tag_relations_v2" ("team_id", "tag_id", "asset_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_data_asset_tag_relations_v2_asset"
      ON "${appId}_data_asset_tag_relations_v2" ("team_id", "asset_id")
    `);

    // ========== data_views_v2 ==========
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "${appId}_data_views_v2" (
        "id" varchar(128) PRIMARY KEY,
        "team_id" varchar(128),
        "name" varchar(255) NOT NULL,
        "description" text,
        "icon_url" varchar(500),
        "parent_id" varchar(128),
        "path" varchar(1000) NOT NULL,
        "level" int NOT NULL DEFAULT 0,
        "sort" int NOT NULL DEFAULT 0,
        "display_config" jsonb,
        "created_timestamp" bigint NOT NULL DEFAULT FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000),
        "updated_timestamp" bigint NOT NULL DEFAULT FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000),
        "is_deleted" boolean NOT NULL DEFAULT false
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_data_views_v2_parent"
      ON "${appId}_data_views_v2" ("team_id", "parent_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_data_views_v2_path"
      ON "${appId}_data_views_v2" ("team_id", "path")
    `);

    // ========== data_view_tag_relations_v2 ==========
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "${appId}_data_view_tag_relations_v2" (
        "id" varchar(128) PRIMARY KEY,
        "team_id" varchar(128) NOT NULL,
        "view_id" varchar(128) NOT NULL,
        "tag_id" varchar(128) NOT NULL,
        "created_timestamp" bigint NOT NULL DEFAULT FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000),
        "updated_timestamp" bigint NOT NULL DEFAULT FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000),
        "is_deleted" boolean NOT NULL DEFAULT false
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "ux_${appId}_data_view_tag_relations_v2"
      ON "${appId}_data_view_tag_relations_v2" ("team_id", "view_id", "tag_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_data_view_tag_relations_v2_view"
      ON "${appId}_data_view_tag_relations_v2" ("team_id", "view_id")
    `);

    // ========== data_outbox_events_v2 (optional) ==========
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "${appId}_data_outbox_events_v2" (
        "event_id" bigserial PRIMARY KEY,
        "team_id" varchar(128) NOT NULL,
        "aggregate_id" varchar(128) NOT NULL,
        "event_type" varchar(50) NOT NULL,
        "payload" jsonb NOT NULL,
        "created_timestamp" bigint NOT NULL DEFAULT FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000),
        "processed_timestamp" bigint,
        "retry_count" int NOT NULL DEFAULT 0,
        "locked_at" bigint,
        "locked_by" varchar(128)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_data_outbox_events_v2_pending"
      ON "${appId}_data_outbox_events_v2" ("event_id")
      WHERE "processed_timestamp" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_${appId}_data_outbox_events_v2_pending"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "${appId}_data_outbox_events_v2"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_${appId}_data_view_tag_relations_v2_view"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "ux_${appId}_data_view_tag_relations_v2"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "${appId}_data_view_tag_relations_v2"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_${appId}_data_views_v2_path"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_${appId}_data_views_v2_parent"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "${appId}_data_views_v2"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_${appId}_data_asset_tag_relations_v2_asset"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_${appId}_data_asset_tag_relations_v2_tag"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "ux_${appId}_data_asset_tag_relations_v2"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "${appId}_data_asset_tag_relations_v2"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_${appId}_data_tags_v2_team_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_${appId}_data_tags_v2_team_norm"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "${appId}_data_tags_v2"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_${appId}_data_assets_v2_team_updated"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "${appId}_data_assets_v2"`);
  }
}
