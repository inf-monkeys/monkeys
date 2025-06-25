import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1750750201751 implements MigrationInterface {
  name = 'Migration1750750201751';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."monkeys_evaluators_type_enum" AS ENUM('llm', 'human')`);
    await queryRunner.query(
      `CREATE TABLE "monkeys_evaluators" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying(255) NOT NULL, "type" "public"."monkeys_evaluators_type_enum" NOT NULL, "llm_model_name" character varying(255), "evaluation_focus" text, "human_user_id" character varying, "is_active" boolean NOT NULL DEFAULT true, "config" jsonb, CONSTRAINT "PK_f10aec9bddfe575f6cbb218ec97" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE TYPE "public"."monkeys_battle_groups_strategy_enum" AS ENUM('ROUND_ROBIN', 'RANDOM_PAIRS')`);
    await queryRunner.query(`CREATE TYPE "public"."monkeys_battle_groups_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED')`);
    await queryRunner.query(
      `CREATE TABLE "monkeys_battle_groups" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "evaluation_module_id" character varying NOT NULL, "assetIds" jsonb NOT NULL, "strategy" "public"."monkeys_battle_groups_strategy_enum" NOT NULL, "totalBattles" integer NOT NULL, "completedBattles" integer NOT NULL DEFAULT '0', "failedBattles" integer NOT NULL DEFAULT '0', "status" "public"."monkeys_battle_groups_status_enum" NOT NULL DEFAULT 'PENDING', "description" text, "startedAt" TIMESTAMP, "completedAt" TIMESTAMP, CONSTRAINT "PK_41bc16cc24c7ae629a92f7c513f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE TYPE "public"."monkeys_evaluation_battles_result_enum" AS ENUM('A_WIN', 'B_WIN', 'DRAW')`);
    await queryRunner.query(
      `CREATE TABLE "monkeys_evaluation_battles" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "evaluation_module_id" character varying NOT NULL, "battle_group_id" character varying, "asset_a_id" character varying NOT NULL, "asset_b_id" character varying NOT NULL, "winnerId" character varying, "result" "public"."monkeys_evaluation_battles_result_enum", "evaluator_id" character varying, "reason" text, "asset_a_rating_before" double precision, "asset_a_rating_after" double precision, "asset_b_rating_before" double precision, "asset_b_rating_after" double precision, "completed_at" TIMESTAMP, CONSTRAINT "PK_a657ca0cde86f9962b9c4161aa6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE TABLE "monkeys_leaderboards" ("id" character varying(128) NOT NULL, CONSTRAINT "PK_c42826eaa589763562e02009666" PRIMARY KEY ("id"))`);
    await queryRunner.query(
      `CREATE TABLE "monkeys_evaluation_modules" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying, "creator_user_id" character varying, "icon_url" character varying, "display_name" character varying NOT NULL, "description" character varying, "is_preset" boolean NOT NULL DEFAULT false, "is_published" boolean NOT NULL DEFAULT false, "publish_config" text, "leaderboard_id" character varying NOT NULL, "evaluation_criteria" text, "glicko_config" jsonb NOT NULL DEFAULT '{"rating":1500,"rd":350,"vol":0.06,"tau":0.5}', "participant_asset_ids" jsonb NOT NULL DEFAULT '[]', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_6e97da9ff6e4ae69299b81567c2" UNIQUE ("leaderboard_id"), CONSTRAINT "REL_6e97da9ff6e4ae69299b81567c" UNIQUE ("leaderboard_id"), CONSTRAINT "PK_ad539b753f24c9887c57c4916cd" PRIMARY KEY ("id")); COMMENT ON COLUMN "monkeys_evaluation_modules"."is_published" IS '此资产是否被发布'`,
    );
    await queryRunner.query(
      `CREATE TABLE "monkeys_module_evaluators" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "evaluation_module_id" character varying NOT NULL, "evaluator_id" character varying NOT NULL, "weight" numeric(3,2) NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_f8156f603277b2c16fd5ff7edaa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0e8ac197595879e55178e1a838" ON "monkeys_module_evaluators" ("evaluation_module_id", "evaluator_id") `);
    await queryRunner.query(
      `CREATE TABLE "monkeys_leaderboard_scores" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "evaluation_module_id" character varying NOT NULL, "asset_id" character varying NOT NULL, "scores_by_evaluator" jsonb NOT NULL DEFAULT '{}', "gamesPlayed" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_d501956ce8d39251b50c4f2ecc2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e519ec3eac178ef6b2657be3d5" ON "monkeys_leaderboard_scores" ("evaluation_module_id", "asset_id") `);
    await queryRunner.query(
      `ALTER TABLE "monkeys_battle_groups" ADD CONSTRAINT "FK_f9807641f1032e534eb7057d3f8" FOREIGN KEY ("evaluation_module_id") REFERENCES "monkeys_evaluation_modules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "monkeys_evaluation_battles" ADD CONSTRAINT "FK_99386635b3df97e793958f41769" FOREIGN KEY ("evaluation_module_id") REFERENCES "monkeys_evaluation_modules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "monkeys_evaluation_battles" ADD CONSTRAINT "FK_8f654d71d6ab0e5626c731f942e" FOREIGN KEY ("evaluator_id") REFERENCES "monkeys_evaluators"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "monkeys_evaluation_battles" ADD CONSTRAINT "FK_7639140ffa81a653ada39e7b96a" FOREIGN KEY ("battle_group_id") REFERENCES "monkeys_battle_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "monkeys_evaluation_modules" ADD CONSTRAINT "FK_6e97da9ff6e4ae69299b81567c2" FOREIGN KEY ("leaderboard_id") REFERENCES "monkeys_leaderboards"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "monkeys_module_evaluators" ADD CONSTRAINT "FK_a0542b6e347976d3d47b7bbbe51" FOREIGN KEY ("evaluation_module_id") REFERENCES "monkeys_evaluation_modules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "monkeys_module_evaluators" ADD CONSTRAINT "FK_9102148471aba18cc8a4a4b5b47" FOREIGN KEY ("evaluator_id") REFERENCES "monkeys_evaluators"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "monkeys_leaderboard_scores" ADD CONSTRAINT "FK_0bee0e88684ec0e71f168b8d25a" FOREIGN KEY ("evaluation_module_id") REFERENCES "monkeys_evaluation_modules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "monkeys_leaderboard_scores" DROP CONSTRAINT "FK_0bee0e88684ec0e71f168b8d25a"`);
    await queryRunner.query(`ALTER TABLE "monkeys_module_evaluators" DROP CONSTRAINT "FK_9102148471aba18cc8a4a4b5b47"`);
    await queryRunner.query(`ALTER TABLE "monkeys_module_evaluators" DROP CONSTRAINT "FK_a0542b6e347976d3d47b7bbbe51"`);
    await queryRunner.query(`ALTER TABLE "monkeys_evaluation_modules" DROP CONSTRAINT "FK_6e97da9ff6e4ae69299b81567c2"`);
    await queryRunner.query(`ALTER TABLE "monkeys_evaluation_battles" DROP CONSTRAINT "FK_7639140ffa81a653ada39e7b96a"`);
    await queryRunner.query(`ALTER TABLE "monkeys_evaluation_battles" DROP CONSTRAINT "FK_8f654d71d6ab0e5626c731f942e"`);
    await queryRunner.query(`ALTER TABLE "monkeys_evaluation_battles" DROP CONSTRAINT "FK_99386635b3df97e793958f41769"`);
    await queryRunner.query(`ALTER TABLE "monkeys_battle_groups" DROP CONSTRAINT "FK_f9807641f1032e534eb7057d3f8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e519ec3eac178ef6b2657be3d5"`);
    await queryRunner.query(`DROP TABLE "monkeys_leaderboard_scores"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0e8ac197595879e55178e1a838"`);
    await queryRunner.query(`DROP TABLE "monkeys_module_evaluators"`);
    await queryRunner.query(`DROP TABLE "monkeys_evaluation_modules"`);
    await queryRunner.query(`DROP TABLE "monkeys_leaderboards"`);
    await queryRunner.query(`DROP TABLE "monkeys_evaluation_battles"`);
    await queryRunner.query(`DROP TYPE "public"."monkeys_evaluation_battles_result_enum"`);
    await queryRunner.query(`DROP TABLE "monkeys_battle_groups"`);
    await queryRunner.query(`DROP TYPE "public"."monkeys_battle_groups_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."monkeys_battle_groups_strategy_enum"`);
    await queryRunner.query(`DROP TABLE "monkeys_evaluators"`);
    await queryRunner.query(`DROP TYPE "public"."monkeys_evaluators_type_enum"`);
  }
}
