import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

const tableName = `${appId}_workflow_artifacts`;

export class Migration1753348899760 implements MigrationInterface {
  name = 'Migration1753348899760';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "${tableName}" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "url" character varying NOT NULL, "type" character varying NOT NULL, "instance_id" character varying NOT NULL, CONSTRAINT "PK_${appId}_4122b0d28775f7c4c7af99bff65" PRIMARY KEY ("id", "url"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "${tableName}"`);
  }
}
