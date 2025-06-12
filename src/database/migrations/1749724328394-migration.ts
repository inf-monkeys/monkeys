import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1749724328394 implements MigrationInterface {
  name = 'Migration1749724328394';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."monkeys_marketplace_app_versions_status_enum" AS ENUM('ACTIVE', 'DEPRECATED')`);
    await queryRunner.query(
      `CREATE TABLE "monkeys_marketplace_app_versions" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "app_id" character varying NOT NULL, "version" character varying NOT NULL, "release_notes" text, "asset_snapshot" jsonb NOT NULL, "source_asset_references" jsonb, "status" "public"."monkeys_marketplace_app_versions_status_enum" NOT NULL DEFAULT 'ACTIVE', CONSTRAINT "PK_9f54fef467290879d7a876ca115" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_6750d4b8e6b81434689477f3d1" ON "monkeys_marketplace_app_versions" ("app_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_76447c217f5455f26b41e603cb" ON "monkeys_marketplace_app_versions" ("status") `);
    await queryRunner.query(`CREATE TYPE "public"."monkeys_marketplace_apps_status_enum" AS ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ARCHIVED')`);
    await queryRunner.query(
      `CREATE TABLE "monkeys_marketplace_apps" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying NOT NULL, "description" text, "icon_url" character varying, "asset_type" character varying NOT NULL, "author_team_id" character varying NOT NULL, "status" "public"."monkeys_marketplace_apps_status_enum" NOT NULL DEFAULT 'PENDING_APPROVAL', "categories" text, "total_installs" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_59b603d1b223364620152602cfa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_d025eab43f675bef2cdaad36a5" ON "monkeys_marketplace_apps" ("asset_type") `);
    await queryRunner.query(`CREATE INDEX "IDX_442a4eb5e57ff71c05cf1d05d5" ON "monkeys_marketplace_apps" ("author_team_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_4f3e01bd331ec4b1b3241c8cbc" ON "monkeys_marketplace_apps" ("status") `);
    await queryRunner.query(
      `CREATE TABLE "monkeys_installed_apps" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "user_id" character varying NOT NULL, "installed_asset_ids" jsonb NOT NULL, "marketplace_app_version_id" character varying NOT NULL, "is_update_available" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_40aa97573ef6bbcaada61166a47" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_eae2d553cd6474d78ab57cd295" ON "monkeys_installed_apps" ("team_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_123ed0b640eb5546e126dca337" ON "monkeys_installed_apps" ("installed_asset_ids") `);
    await queryRunner.query(`CREATE INDEX "IDX_a4c7ff66a6588cb5a745601913" ON "monkeys_installed_apps" ("marketplace_app_version_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_82038f3b7ca70ae895575d4b63" ON "monkeys_installed_apps" ("is_update_available") `);
    await queryRunner.query(`ALTER TABLE "monkeys_users" ADD "is_admin" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(
      `ALTER TABLE "monkeys_marketplace_app_versions" ADD CONSTRAINT "FK_6750d4b8e6b81434689477f3d1f" FOREIGN KEY ("app_id") REFERENCES "monkeys_marketplace_apps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "monkeys_marketplace_app_versions" DROP CONSTRAINT "FK_6750d4b8e6b81434689477f3d1f"`);
    await queryRunner.query(`ALTER TABLE "monkeys_users" DROP COLUMN "is_admin"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_82038f3b7ca70ae895575d4b63"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a4c7ff66a6588cb5a745601913"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_123ed0b640eb5546e126dca337"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_eae2d553cd6474d78ab57cd295"`);
    await queryRunner.query(`DROP TABLE "monkeys_installed_apps"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4f3e01bd331ec4b1b3241c8cbc"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_442a4eb5e57ff71c05cf1d05d5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d025eab43f675bef2cdaad36a5"`);
    await queryRunner.query(`DROP TABLE "monkeys_marketplace_apps"`);
    await queryRunner.query(`DROP TYPE "public"."monkeys_marketplace_apps_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_76447c217f5455f26b41e603cb"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6750d4b8e6b81434689477f3d1"`);
    await queryRunner.query(`DROP TABLE "monkeys_marketplace_app_versions"`);
    await queryRunner.query(`DROP TYPE "public"."monkeys_marketplace_app_versions_status_enum"`);
  }
}
