import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class Migration1751317144032 implements MigrationInterface {
  name = 'Migration1751317144032';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "${appId}_evaluation_rating_history" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "evaluation_module_id" character varying NOT NULL, "asset_id" character varying NOT NULL, "battle_id" character varying NOT NULL, "mu_before" double precision NOT NULL, "mu_after" double precision NOT NULL, "sigma_before" double precision NOT NULL, "sigma_after" double precision NOT NULL, "rating_before" double precision NOT NULL, "rating_after" double precision NOT NULL, "rating_change" double precision NOT NULL, CONSTRAINT "PK_${appId}_c71a60740bb96baa9932bd88da6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_${appId}_b6b4c4484af6e733d16da2c796" ON "${appId}_evaluation_rating_history" ("evaluation_module_id", "asset_id", "battle_id") `);
    await queryRunner.query(`ALTER TABLE "${appId}_leaderboard_scores" ADD "wins" integer NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "${appId}_leaderboard_scores" ADD "losses" integer NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "${appId}_leaderboard_scores" ADD "draws" integer NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "${appId}_leaderboard_scores" ADD "totalBattles" integer NOT NULL DEFAULT '0'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${appId}_leaderboard_scores" DROP COLUMN "totalBattles"`);
    await queryRunner.query(`ALTER TABLE "${appId}_leaderboard_scores" DROP COLUMN "draws"`);
    await queryRunner.query(`ALTER TABLE "${appId}_leaderboard_scores" DROP COLUMN "losses"`);
    await queryRunner.query(`ALTER TABLE "${appId}_leaderboard_scores" DROP COLUMN "wins"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_b6b4c4484af6e733d16da2c796"`);
    await queryRunner.query(`DROP TABLE "${appId}_evaluation_rating_history"`);
  }
}
