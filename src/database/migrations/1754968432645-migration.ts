import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class Migration1754968432645 implements MigrationInterface {
  name = 'Migration1754968432645';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_metadatas" ADD "prefer_app_id" character varying`);
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_associations" ADD "prefer_app_id" character varying`);
    await queryRunner.query(`ALTER TABLE "${appId}_evaluation_modules" ADD "prefer_app_id" character varying`);
    await queryRunner.query(`ALTER TABLE "${appId}_design_project" ADD "prefer_app_id" character varying`);
    await queryRunner.query(`ALTER TABLE "${appId}_conversation_apps" ADD "prefer_app_id" character varying`);
    await queryRunner.query(`ALTER TABLE "${appId}_design_associations" ADD "prefer_app_id" character varying`);
    await queryRunner.query(`ALTER TABLE "${appId}_comfyui_workflows" ADD "prefer_app_id" character varying`);
    await queryRunner.query(`ALTER TABLE "${appId}_comfyui_model" ADD "prefer_app_id" character varying`);
    await queryRunner.query(`ALTER TABLE "${appId}_knowledge_bases" ADD "prefer_app_id" character varying`);
    await queryRunner.query(`ALTER TABLE "${appId}_knowledge_bases_sql" ADD "prefer_app_id" character varying`);
    await queryRunner.query(`ALTER TABLE "${appId}_canvas_applications" ADD "prefer_app_id" character varying`);
    await queryRunner.query(`ALTER TABLE "${appId}_media_files" ADD "prefer_app_id" character varying`);
    await queryRunner.query(`ALTER TABLE "${appId}_llm_models" ADD "prefer_app_id" character varying`);
    await queryRunner.query(`ALTER TABLE "${appId}_comfyui_model_type" ADD "prefer_app_id" character varying`);
    await queryRunner.query(`ALTER TABLE "${appId}_llm_channels" ADD "prefer_app_id" character varying`);
    await queryRunner.query(`ALTER TABLE "${appId}_sd_models" ADD "prefer_app_id" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${appId}_sd_models" DROP COLUMN "prefer_app_id"`);
    await queryRunner.query(`ALTER TABLE "${appId}_llm_channels" DROP COLUMN "prefer_app_id"`);
    await queryRunner.query(`ALTER TABLE "${appId}_comfyui_model_type" DROP COLUMN "prefer_app_id"`);
    await queryRunner.query(`ALTER TABLE "${appId}_llm_models" DROP COLUMN "prefer_app_id"`);
    await queryRunner.query(`ALTER TABLE "${appId}_media_files" DROP COLUMN "prefer_app_id"`);
    await queryRunner.query(`ALTER TABLE "${appId}_canvas_applications" DROP COLUMN "prefer_app_id"`);
    await queryRunner.query(`ALTER TABLE "${appId}_knowledge_bases_sql" DROP COLUMN "prefer_app_id"`);
    await queryRunner.query(`ALTER TABLE "${appId}_knowledge_bases" DROP COLUMN "prefer_app_id"`);
    await queryRunner.query(`ALTER TABLE "${appId}_comfyui_model" DROP COLUMN "prefer_app_id"`);
    await queryRunner.query(`ALTER TABLE "${appId}_comfyui_workflows" DROP COLUMN "prefer_app_id"`);
    await queryRunner.query(`ALTER TABLE "${appId}_design_associations" DROP COLUMN "prefer_app_id"`);
    await queryRunner.query(`ALTER TABLE "${appId}_conversation_apps" DROP COLUMN "prefer_app_id"`);
    await queryRunner.query(`ALTER TABLE "${appId}_design_project" DROP COLUMN "prefer_app_id"`);
    await queryRunner.query(`ALTER TABLE "${appId}_evaluation_modules" DROP COLUMN "prefer_app_id"`);
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_associations" DROP COLUMN "prefer_app_id"`);
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_metadatas" DROP COLUMN "prefer_app_id"`);
  }
}
