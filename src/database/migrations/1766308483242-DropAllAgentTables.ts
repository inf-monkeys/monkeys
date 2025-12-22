import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class DropAllAgentTables1766308483242 implements MigrationInterface {
  name = 'DropAllAgentTables1766308483242';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "${appId}_agent_v2_messages" DROP CONSTRAINT IF EXISTS "FK_${appId}_agent_v2_messages_session_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "${appId}_agent_v2_messages" DROP CONSTRAINT IF EXISTS "FK_${appId}_agent_v2_messages_agent_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "${appId}_agent_v2_sessions" DROP CONSTRAINT IF EXISTS "FK_${appId}_agent_v2_sessions_agent_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "${appId}_agent_v2_sessions" DROP CONSTRAINT IF EXISTS "FK_${appId}_agent_v2_sessions_team_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "${appId}_agent_v2" DROP CONSTRAINT IF EXISTS "FK_${appId}_agent_v2_team_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "${appId}_agent_v2" DROP CONSTRAINT IF EXISTS "FK_${appId}_agent_v2_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "${appId}_agent_v3_messages" DROP CONSTRAINT IF EXISTS "FK_${appId}_agent_v3_messages_session_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "${appId}_agent_v3_sessions" DROP CONSTRAINT IF EXISTS "FK_${appId}_agent_v3_sessions_team_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE IF EXISTS "${appId}_tldraw_agent_v3_binding" DROP CONSTRAINT IF EXISTS "FK_${appId}_tldraw_agent_v3_binding_team_id"`,
    );

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_${appId}_agent_v2_messages_session_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_${appId}_agent_v2_sessions_agent_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_${appId}_agent_v2_team_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_${appId}_agent_v3_messages_session_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_${appId}_agent_v3_sessions_team_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_${appId}_tldraw_agent_v3_binding_team_id"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "${appId}_agent_v2_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "${appId}_agent_v2_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "${appId}_agent_v2_task_states"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "${appId}_agent_v2_message_queue"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "${appId}_agent_v2"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "${appId}_agent_v3_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "${appId}_agent_v3_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "${appId}_tldraw_agent_v3_binding"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."${appId}_agent_v2_task_states_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."${appId}_agent_v2_message_queue_status_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No down migration - cannot restore deleted tables
    throw new Error('Cannot rollback agent table deletion - no data to restore');
  }
}
