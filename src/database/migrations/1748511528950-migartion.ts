import { MigrationInterface, QueryRunner } from 'typeorm';

import { config } from '@/common/config';
const appId = config.server.appId;

export class Migartion1748511528950 implements MigrationInterface {
  name = 'Migartion1748511528950';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_execution" ADD "input" jsonb`);
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_execution" ADD "output" jsonb`);
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_execution" ADD "tasks" jsonb`);
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_execution" ADD "conductor_create_time" bigint`);
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_execution" ADD "conductor_start_time" bigint`);
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_execution" ADD "conductor_end_time" bigint`);
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_execution" ADD "conductor_update_time" bigint`);
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_execution" ADD "executed_workflow_definition" jsonb`);
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_execution" ADD "execution_variables" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_execution" DROP COLUMN "execution_variables"`);
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_execution" DROP COLUMN "executed_workflow_definition"`);
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_execution" DROP COLUMN "conductor_update_time"`);
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_execution" DROP COLUMN "conductor_end_time"`);
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_execution" DROP COLUMN "conductor_start_time"`);
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_execution" DROP COLUMN "conductor_create_time"`);
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_execution" DROP COLUMN "tasks"`);
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_execution" DROP COLUMN "output"`);
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_execution" DROP COLUMN "input"`);
  }
}
