import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;
const evaluatorsTable = `${appId}_evaluators`;

export class FixLlmModelName1759315200000 implements MigrationInterface {
  name = 'FixLlmModelName1759315200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "${evaluatorsTable}"
      SET "llm_model_name" = 'gpt-4o-mini'
      WHERE "type" = 'llm'
        AND "llm_model_name" IS NOT NULL
        AND position(':' in "llm_model_name") > 0
        AND "llm_model_name" !~ '^[0-9]+:'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 无法可靠恢复原始前缀，保持为空操作
    return;
  }
}
