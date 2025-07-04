import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class Migration1751484169604 implements MigrationInterface {
  name = 'Migration1751484169604';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."${appId}_evaluation_tasks_type_enum" AS ENUM('evaluate_battle_group', 'add_assets_to_module')`);
    await queryRunner.query(`CREATE TYPE "public"."${appId}_evaluation_tasks_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled')`);
    await queryRunner.query(
      `CREATE TABLE "${appId}_evaluation_tasks" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "type" "public"."${appId}_evaluation_tasks_type_enum" NOT NULL, "module_id" character varying NOT NULL, "team_id" character varying NOT NULL, "user_id" character varying NOT NULL, "status" "public"."${appId}_evaluation_tasks_status_enum" NOT NULL DEFAULT 'pending', "started_at" TIMESTAMP, "completed_at" TIMESTAMP, "error" text, "processor_id" character varying, "heartbeat_at" TIMESTAMP, "retry_count" integer NOT NULL DEFAULT '0', "max_retries" integer NOT NULL DEFAULT '3', "timeout_minutes" integer NOT NULL DEFAULT '30', "total" integer NOT NULL DEFAULT '0', "completed" integer NOT NULL DEFAULT '0', "failed" integer NOT NULL DEFAULT '0', "current_item" character varying, "payload" jsonb NOT NULL, CONSTRAINT "PK_${appId}_61db84ad5d812386d66e79030e6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_27768d51cce9344009041ea5fa" ON "${appId}_evaluation_tasks" ("processor_id", "status") `);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_6176b1b4037775e35932b50f5a" ON "${appId}_evaluation_tasks" ("status", "heartbeat_at") `);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_7a9c03fd5acc3d3f7a2b17d787" ON "${appId}_evaluation_tasks" ("module_id", "status") `);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_0d9e4a96b7a7be88eace82dabf" ON "${appId}_evaluation_tasks" ("team_id", "status") `);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_f1ae9308a024994b50787dba24" ON "${appId}_evaluation_tasks" ("status", "created_timestamp") `);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_9c2add104ff945c4ea6580a0f6" ON "${appId}_evaluation_battles" ("evaluator_id", "evaluation_module_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_b876dccb9b1f48dbbcc98f76bf" ON "${appId}_evaluation_battles" ("asset_b_id", "evaluation_module_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_5358e37465cb3f9d8212c457ab" ON "${appId}_evaluation_battles" ("asset_a_id", "evaluation_module_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_7f8a0a725abf0ffaaad9b4aab9" ON "${appId}_evaluation_battles" ("evaluation_module_id", "completed_at") `);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_99386635b3df97e793958f4176" ON "${appId}_evaluation_battles" ("evaluation_module_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_407acd77532b310e26e211ecb0" ON "${appId}_evaluation_modules" ("team_id", "is_active") `);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_57116ca92fa12e0c66e4c1b85f" ON "${appId}_evaluation_modules" ("team_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_c327dd9f5220e0021dc7b3016c" ON "${appId}_leaderboard_scores" ("evaluation_module_id", "wins") `);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_02d922c3b8edd64e8254b09cd8" ON "${appId}_leaderboard_scores" ("evaluation_module_id", "totalBattles") `);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_a0aba0ab7137761d356dfff1ce" ON "${appId}_evaluation_rating_history" ("evaluation_module_id", "created_timestamp") `);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_ea4af09b91e984f2aea9ec0ff0" ON "${appId}_evaluation_rating_history" ("asset_id", "evaluation_module_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_ac53688f960ffda5bf59abc1ef" ON "${appId}_media_files" ("team_id", "type") `);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_0b5a33781dc945f6b2d93f27e5" ON "${appId}_media_files" ("team_id", "created_timestamp") `);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_6c9dd9fd88f853ad5a76388729" ON "${appId}_media_files" ("team_id") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_6c9dd9fd88f853ad5a76388729"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_0b5a33781dc945f6b2d93f27e5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_ac53688f960ffda5bf59abc1ef"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_ea4af09b91e984f2aea9ec0ff0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_a0aba0ab7137761d356dfff1ce"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_02d922c3b8edd64e8254b09cd8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_c327dd9f5220e0021dc7b3016c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_57116ca92fa12e0c66e4c1b85f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_407acd77532b310e26e211ecb0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_99386635b3df97e793958f4176"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_7f8a0a725abf0ffaaad9b4aab9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_5358e37465cb3f9d8212c457ab"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_b876dccb9b1f48dbbcc98f76bf"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_9c2add104ff945c4ea6580a0f6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_f1ae9308a024994b50787dba24"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_0d9e4a96b7a7be88eace82dabf"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_7a9c03fd5acc3d3f7a2b17d787"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_6176b1b4037775e35932b50f5a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_27768d51cce9344009041ea5fa"`);
    await queryRunner.query(`DROP TABLE "${appId}_evaluation_tasks"`);
    await queryRunner.query(`DROP TYPE "public"."${appId}_evaluation_tasks_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."${appId}_evaluation_tasks_type_enum"`);
  }
}
