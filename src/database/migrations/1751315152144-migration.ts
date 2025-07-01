import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1751315152144 implements MigrationInterface {
  name = 'Migration1751315152144';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "monkeys_evaluation_battles" DROP COLUMN "asset_a_rating_after"`);
    await queryRunner.query(`ALTER TABLE "monkeys_evaluation_battles" DROP COLUMN "asset_b_rating_after"`);
    await queryRunner.query(`ALTER TABLE "monkeys_evaluation_battles" DROP COLUMN "asset_a_rating_before"`);
    await queryRunner.query(`ALTER TABLE "monkeys_evaluation_battles" DROP COLUMN "asset_b_rating_before"`);
    await queryRunner.query(`ALTER TABLE "monkeys_evaluation_modules" DROP COLUMN "glicko_config"`);
    await queryRunner.query(`ALTER TABLE "monkeys_leaderboard_scores" DROP COLUMN "scores_by_evaluator"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "monkeys_leaderboard_scores" ADD "scores_by_evaluator" jsonb NOT NULL DEFAULT '{}'`);
    await queryRunner.query(`ALTER TABLE "monkeys_evaluation_modules" ADD "glicko_config" jsonb NOT NULL DEFAULT '{"rd": 350, "tau": 0.5, "vol": 0.06, "rating": 1500}'`);
    await queryRunner.query(`ALTER TABLE "monkeys_evaluation_battles" ADD "asset_b_rating_before" double precision`);
    await queryRunner.query(`ALTER TABLE "monkeys_evaluation_battles" ADD "asset_a_rating_before" double precision`);
    await queryRunner.query(`ALTER TABLE "monkeys_evaluation_battles" ADD "asset_b_rating_after" double precision`);
    await queryRunner.query(`ALTER TABLE "monkeys_evaluation_battles" ADD "asset_a_rating_after" double precision`);
  }
}
