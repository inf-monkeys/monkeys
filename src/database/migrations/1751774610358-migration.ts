import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class Migration1751774610358 implements MigrationInterface {
  name = 'Migration1751774610358';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "${appId}_design_associations" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying(128) NOT NULL, "enabled" boolean NOT NULL, "display_name" jsonb NOT NULL, "description" jsonb, "icon_url" text, "sort_index" integer, "target_workflow_id" character varying, "target_input_id" text NOT NULL, CONSTRAINT "PK_${appId}_0335a7f45b69a2869e569d2ad1e" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "${appId}_design_associations"`);
  }
}
