import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

const tableName = `${appId}_workflow_associations`;

export class Migration1749741812232 implements MigrationInterface {
    name = 'Migration1749741812232';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "${tableName}" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "enabled" boolean NOT NULL, "display_name" jsonb NOT NULL, "description" jsonb, "icon_url" text, "origin_workflow_id" character varying NOT NULL, "target_workflow_id" character varying NOT NULL, "mapper" jsonb NOT NULL, CONSTRAINT "PK_437489b7b80b0814e3daece934f" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`ALTER TABLE "${tableName}" ADD "sort_index" integer`);

        await queryRunner.query(
            `ALTER TABLE "${tableName}" ADD CONSTRAINT "FK_73b8050704d0dc2e964de99331e" FOREIGN KEY ("origin_workflow_id") REFERENCES "monkeys_workflow_metadatas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "${tableName}" ADD CONSTRAINT "FK_9ccbabc8e32c74e347dbaea384a" FOREIGN KEY ("target_workflow_id") REFERENCES "monkeys_workflow_metadatas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "${tableName}" DROP CONSTRAINT "FK_9ccbabc8e32c74e347dbaea384a"`);
        await queryRunner.query(`ALTER TABLE "${tableName}" DROP CONSTRAINT "FK_73b8050704d0dc2e964de99331e"`);
        await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN "sort_index"`);
        await queryRunner.query(`DROP TABLE "${tableName}"`);
    }
}
