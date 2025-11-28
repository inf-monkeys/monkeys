import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;
const tableName = `${appId}_tldraw_agent_v3_binding`;

export class Migration1764232108290 implements MigrationInterface {
  name = 'Migration1764232108290';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "${tableName}" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "session_id" character varying NOT NULL, "board_id" character varying NOT NULL, "team_id" character varying NOT NULL, "user_id" character varying NOT NULL, CONSTRAINT "PK_${appId}_tldraw_agent_v3_binding" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_tldraw_v3_binding_session" ON "${tableName}" ("session_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_tldraw_v3_binding_team" ON "${tableName}" ("team_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_tldraw_v3_binding_user" ON "${tableName}" ("user_id") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_${appId}_tldraw_v3_binding_board_team" ON "${tableName}" ("board_id", "team_id") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_tldraw_v3_binding_board_team"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_tldraw_v3_binding_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_tldraw_v3_binding_team"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_tldraw_v3_binding_session"`);
    await queryRunner.query(`DROP TABLE "${tableName}"`);
  }
}
