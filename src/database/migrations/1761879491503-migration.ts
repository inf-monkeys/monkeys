import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class Migration1761879491503 implements MigrationInterface {
  name = 'Migration1761879491503';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "${appId}_tools_execution" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying NOT NULL, "namespace" character varying NOT NULL, "workflow_execution_id" character varying NOT NULL, "takes" integer, "input" jsonb, "output" jsonb, CONSTRAINT "PK_${appId}_6a5314adc2b50ef2c3cb1d1c8d2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "${appId}_tools_execution" ADD CONSTRAINT "FK_${appId}_3da836f8a630bb0080504d18d98" FOREIGN KEY ("workflow_execution_id") REFERENCES "${appId}_workflow_execution"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${appId}_tools_execution" DROP CONSTRAINT "FK_${appId}_3da836f8a630bb0080504d18d98"`);
    await queryRunner.query(`DROP TABLE "${appId}_tools_execution"`);
  }
}
