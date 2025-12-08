import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;
export class Migration1760346522262 implements MigrationInterface {
  name = 'Migration1760346522262';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_metadatas" ADD "sort" integer DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "${appId}_evaluation_modules" ADD "sort" integer DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "${appId}_design_project" ADD "sort" integer DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "${appId}_comfyui_workflows" ADD "sort" integer DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "${appId}_conversation_apps" ADD "sort" integer DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "${appId}_comfyui_model" ADD "sort" integer DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "${appId}_media_files" ADD "sort" integer DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "${appId}_knowledge_bases" ADD "sort" integer DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "${appId}_knowledge_bases_sql" ADD "sort" integer DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "${appId}_canvas_applications" ADD "sort" integer DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "${appId}_sd_models" ADD "sort" integer DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "${appId}_llm_models" ADD "sort" integer DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "${appId}_comfyui_model_type" ADD "sort" integer DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "${appId}_llm_channels" ADD "sort" integer DEFAULT '0'`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${appId}_llm_channels" DROP COLUMN "sort"`);
    await queryRunner.query(`ALTER TABLE "${appId}_comfyui_model_type" DROP COLUMN "sort"`);
    await queryRunner.query(`ALTER TABLE "${appId}_llm_models" DROP COLUMN "sort"`);
    await queryRunner.query(`ALTER TABLE "${appId}_sd_models" DROP COLUMN "sort"`);
    await queryRunner.query(`ALTER TABLE "${appId}_canvas_applications" DROP COLUMN "sort"`);
    await queryRunner.query(`ALTER TABLE "${appId}_knowledge_bases_sql" DROP COLUMN "sort"`);
    await queryRunner.query(`ALTER TABLE "${appId}_knowledge_bases" DROP COLUMN "sort"`);
    await queryRunner.query(`ALTER TABLE "${appId}_media_files" DROP COLUMN "sort"`);
    await queryRunner.query(`ALTER TABLE "${appId}_comfyui_model" DROP COLUMN "sort"`);
    await queryRunner.query(`ALTER TABLE "${appId}_conversation_apps" DROP COLUMN "sort"`);
    await queryRunner.query(`ALTER TABLE "${appId}_comfyui_workflows" DROP COLUMN "sort"`);
    await queryRunner.query(`ALTER TABLE "${appId}_design_project" DROP COLUMN "sort"`);
    await queryRunner.query(`ALTER TABLE "${appId}_evaluation_modules" DROP COLUMN "sort"`);
    await queryRunner.query(`ALTER TABLE "${appId}_workflow_metadatas" DROP COLUMN "sort"`);
  }
}
