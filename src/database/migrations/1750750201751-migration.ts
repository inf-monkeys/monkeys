import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

const evaluatorsTypeEnum = `${appId}_evaluators_type_enum`;
const battleGroupsStrategyEnum = `${appId}_battle_groups_strategy_enum`;
const battleGroupsStatusEnum = `${appId}_battle_groups_status_enum`;
const evaluationBattlesResultEnum = `${appId}_evaluation_battles_result_enum`;

const evaluatorsTable = `${appId}_evaluators`;
const evaluatorsTablePK = `PK_${appId}_f10aec9bddfe575f6cbb218ec97`;

const battleGroupsTable = `${appId}_battle_groups`;
const battleGroupsTablePK = `PK_${appId}_41bc16cc24c7ae629a92f7c513f`;

const evaluationBattlesTable = `${appId}_evaluation_battles`;
const evaluationBattlesTablePK = `PK_${appId}_a657ca0cde86f9962b9c4161aa6`;

const leaderboardsTable = `${appId}_leaderboards`;
const leaderboardsTablePK = `PK_${appId}_c42826eaa589763562e02009666`;

const evaluationModulesTable = `${appId}_evaluation_modules`;
const evaluationModulesTablePK = `PK_${appId}_ad539b753f24c9887c57c4916cd`;
const evaluationModulesTableUQ = `UQ_${appId}_6e97da9ff6e4ae69299b81567c2`;
const evaluationModulesTableREL = `REL_${appId}_6e97da9ff6e4ae69299b81567c`;

const moduleEvaluatorsTable = `${appId}_module_evaluators`;
const moduleEvaluatorsTablePK = `PK_${appId}_f8156f603277b2c16fd5ff7edaa`;
const moduleEvaluatorsTableIDX = `IDX_${appId}_0e8ac197595879e55178e1a838`;

const leaderboardScoresTable = `${appId}_leaderboard_scores`;
const leaderboardScoresTablePK = `PK_${appId}_d501956ce8d39251b50c4f2ecc2`;
const leaderboardScoresTableIDX = `IDX_${appId}_e519ec3eac178ef6b2657be3d5`;

const battleGroupAndEvaluationModuleFK = `FK_${appId}_f9807641f1032e534eb7057d3f8`;
const evaluationBattlesAndEvaluationModuleFK = `FK_${appId}_99386635b3df97e793958f41769`;
const evaluationBattlesAndEvaluatorFK = `FK_${appId}_8f654d71d6ab0e5626c731f942e`;
const evaluationBattlesAndBattleGroupFK = `FK_${appId}_7639140ffa81a653ada39e7b96a`;
const evaluationModulesAndLeaderboardFK = `FK_${appId}_6e97da9ff6e4ae69299b81567c2`;
const moduleEvaluatorsAndEvaluationModuleFK = `FK_${appId}_a0542b6e347976d3d47b7bbbe51`;
const moduleEvaluatorsAndEvaluatorFK = `FK_${appId}_9102148471aba18cc8a4a4b5b47`;
const leaderboardScoresAndEvaluationModuleFK = `FK_${appId}_0bee0e88684ec0e71f168b8d25a`;

export class Migration1750750201751 implements MigrationInterface {
  name = 'Migration1750750201751';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."${evaluatorsTypeEnum}" AS ENUM('llm', 'human')`);
    await queryRunner.query(
      `CREATE TABLE "${evaluatorsTable}" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying(255) NOT NULL, "type" "public"."${evaluatorsTypeEnum}" NOT NULL, "llm_model_name" character varying(255), "evaluation_focus" text, "human_user_id" character varying, "is_active" boolean NOT NULL DEFAULT true, "config" jsonb, CONSTRAINT "${evaluatorsTablePK}" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE TYPE "public"."${battleGroupsStrategyEnum}" AS ENUM('ROUND_ROBIN', 'RANDOM_PAIRS')`);
    await queryRunner.query(`CREATE TYPE "public"."${battleGroupsStatusEnum}" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED')`);
    await queryRunner.query(
      `CREATE TABLE "${battleGroupsTable}" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "evaluation_module_id" character varying NOT NULL, "assetIds" jsonb NOT NULL, "strategy" "public"."${battleGroupsStrategyEnum}" NOT NULL, "totalBattles" integer NOT NULL, "completedBattles" integer NOT NULL DEFAULT '0', "failedBattles" integer NOT NULL DEFAULT '0', "status" "public"."${battleGroupsStatusEnum}" NOT NULL DEFAULT 'PENDING', "description" text, "startedAt" TIMESTAMP, "completedAt" TIMESTAMP, CONSTRAINT "${battleGroupsTablePK}" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE TYPE "public"."${evaluationBattlesResultEnum}" AS ENUM('A_WIN', 'B_WIN', 'DRAW')`);
    await queryRunner.query(
      `CREATE TABLE "${evaluationBattlesTable}" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "evaluation_module_id" character varying NOT NULL, "battle_group_id" character varying, "asset_a_id" character varying NOT NULL, "asset_b_id" character varying NOT NULL, "winnerId" character varying, "result" "public"."${evaluationBattlesResultEnum}", "evaluator_id" character varying, "reason" text, "asset_a_rating_before" double precision, "asset_a_rating_after" double precision, "asset_b_rating_before" double precision, "asset_b_rating_after" double precision, "completed_at" TIMESTAMP, CONSTRAINT "${evaluationBattlesTablePK}" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE TABLE "${leaderboardsTable}" ("id" character varying(128) NOT NULL, CONSTRAINT "${leaderboardsTablePK}" PRIMARY KEY ("id"))`);
    await queryRunner.query(
      `CREATE TABLE "${evaluationModulesTable}" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying, "creator_user_id" character varying, "icon_url" character varying, "display_name" character varying NOT NULL, "description" character varying, "is_preset" boolean NOT NULL DEFAULT false, "is_published" boolean NOT NULL DEFAULT false, "publish_config" text, "leaderboard_id" character varying NOT NULL, "evaluation_criteria" text, "glicko_config" jsonb NOT NULL DEFAULT '{"rating":1500,"rd":350,"vol":0.06,"tau":0.5}', "participant_asset_ids" jsonb NOT NULL DEFAULT '[]', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "${evaluationModulesTableUQ}" UNIQUE ("leaderboard_id"), CONSTRAINT "${evaluationModulesTableREL}" UNIQUE ("leaderboard_id"), CONSTRAINT "${evaluationModulesTablePK}" PRIMARY KEY ("id")); COMMENT ON COLUMN "${evaluationModulesTable}"."is_published" IS '此资产是否被发布'`,
    );
    await queryRunner.query(
      `CREATE TABLE "${moduleEvaluatorsTable}" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "evaluation_module_id" character varying NOT NULL, "evaluator_id" character varying NOT NULL, "weight" numeric(3,2) NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "${moduleEvaluatorsTablePK}" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "${moduleEvaluatorsTableIDX}" ON "${moduleEvaluatorsTable}" ("evaluation_module_id", "evaluator_id") `);
    await queryRunner.query(
      `CREATE TABLE "${leaderboardScoresTable}" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "evaluation_module_id" character varying NOT NULL, "asset_id" character varying NOT NULL, "scores_by_evaluator" jsonb NOT NULL DEFAULT '{}', "gamesPlayed" integer NOT NULL DEFAULT '0', CONSTRAINT "${leaderboardScoresTablePK}" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "${leaderboardScoresTableIDX}" ON "${leaderboardScoresTable}" ("evaluation_module_id", "asset_id") `);
    await queryRunner.query(
      `ALTER TABLE "${battleGroupsTable}" ADD CONSTRAINT "${battleGroupAndEvaluationModuleFK}" FOREIGN KEY ("evaluation_module_id") REFERENCES "${evaluationModulesTable}"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${evaluationBattlesTable}" ADD CONSTRAINT "${evaluationBattlesAndEvaluationModuleFK}" FOREIGN KEY ("evaluation_module_id") REFERENCES "${evaluationModulesTable}"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${evaluationBattlesTable}" ADD CONSTRAINT "${evaluationBattlesAndEvaluatorFK}" FOREIGN KEY ("evaluator_id") REFERENCES "${evaluatorsTable}"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${evaluationBattlesTable}" ADD CONSTRAINT "${evaluationBattlesAndBattleGroupFK}" FOREIGN KEY ("battle_group_id") REFERENCES "${battleGroupsTable}"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${evaluationModulesTable}" ADD CONSTRAINT "${evaluationModulesAndLeaderboardFK}" FOREIGN KEY ("leaderboard_id") REFERENCES "${leaderboardsTable}"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${moduleEvaluatorsTable}" ADD CONSTRAINT "${moduleEvaluatorsAndEvaluationModuleFK}" FOREIGN KEY ("evaluation_module_id") REFERENCES "${evaluationModulesTable}"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${moduleEvaluatorsTable}" ADD CONSTRAINT "${moduleEvaluatorsAndEvaluatorFK}" FOREIGN KEY ("evaluator_id") REFERENCES "${evaluatorsTable}"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${leaderboardScoresTable}" ADD CONSTRAINT "${leaderboardScoresAndEvaluationModuleFK}" FOREIGN KEY ("evaluation_module_id") REFERENCES "${evaluationModulesTable}"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${leaderboardScoresTable}" DROP CONSTRAINT "${leaderboardScoresAndEvaluationModuleFK}"`);
    await queryRunner.query(`ALTER TABLE "${moduleEvaluatorsTable}" DROP CONSTRAINT "${moduleEvaluatorsAndEvaluatorFK}"`);
    await queryRunner.query(`ALTER TABLE "${moduleEvaluatorsTable}" DROP CONSTRAINT "${moduleEvaluatorsAndEvaluationModuleFK}"`);
    await queryRunner.query(`ALTER TABLE "${evaluationModulesTable}" DROP CONSTRAINT "${evaluationModulesAndLeaderboardFK}"`);
    await queryRunner.query(`ALTER TABLE "${evaluationBattlesTable}" DROP CONSTRAINT "${evaluationBattlesAndBattleGroupFK}"`);
    await queryRunner.query(`ALTER TABLE "${evaluationBattlesTable}" DROP CONSTRAINT "${evaluationBattlesAndEvaluatorFK}"`);
    await queryRunner.query(`ALTER TABLE "${evaluationBattlesTable}" DROP CONSTRAINT "${evaluationBattlesAndEvaluationModuleFK}"`);
    await queryRunner.query(`ALTER TABLE "${battleGroupsTable}" DROP CONSTRAINT "${battleGroupAndEvaluationModuleFK}"`);
    await queryRunner.query(`DROP INDEX "public"."${leaderboardScoresTableIDX}"`);
    await queryRunner.query(`DROP TABLE "${leaderboardScoresTable}"`);
    await queryRunner.query(`DROP INDEX "public"."${moduleEvaluatorsTableIDX}"`);
    await queryRunner.query(`DROP TABLE "${moduleEvaluatorsTable}"`);
    await queryRunner.query(`DROP TABLE "${evaluationModulesTable}"`);
    await queryRunner.query(`DROP TABLE "${leaderboardsTable}"`);
    await queryRunner.query(`DROP TABLE "${evaluationBattlesTable}"`);
    await queryRunner.query(`DROP TYPE "public"."${evaluationBattlesResultEnum}"`);
    await queryRunner.query(`DROP TABLE "${battleGroupsTable}"`);
    await queryRunner.query(`DROP TYPE "public"."${battleGroupsStatusEnum}"`);
    await queryRunner.query(`DROP TYPE "public"."${battleGroupsStrategyEnum}"`);
    await queryRunner.query(`DROP TABLE "${evaluatorsTable}"`);
    await queryRunner.query(`DROP TYPE "public"."${evaluatorsTypeEnum}"`);
  }
}
