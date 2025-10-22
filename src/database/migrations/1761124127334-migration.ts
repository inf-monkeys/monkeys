import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class Migration1761124127334 implements MigrationInterface {
  name = 'Migration1761124127334';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "${appId}_global_workflow_associations" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "enabled" boolean NOT NULL, "display_name" jsonb NOT NULL, "description" jsonb, "icon_url" text, "sort_index" integer, "team_id" character varying, "type" character varying NOT NULL, "target_workflow_id" character varying, "mapper" jsonb, "extra_data" jsonb, "prefer_app_id" character varying, CONSTRAINT "PK_${appId}_2e91480d5829d618fb7380e3505" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "${appId}_global_workflow_associations" ADD CONSTRAINT "FK_${appId}_16260d5df05dfd11fb3dbfdf0a2" FOREIGN KEY ("target_workflow_id") REFERENCES "${appId}_workflow_metadatas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${appId}_global_workflow_associations" DROP CONSTRAINT "FK_${appId}_16260d5df05dfd11fb3dbfdf0a2"`);
    await queryRunner.query(`DROP TABLE "${appId}_global_workflow_associations"`);
  }
}
