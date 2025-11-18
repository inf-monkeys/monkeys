import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class Migration1763373505630 implements MigrationInterface {
  name = 'Migration1763373505630';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "${appId}_agent_v3_sessions" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "user_id" character varying NOT NULL, "title" character varying, "model_id" character varying, CONSTRAINT "pk_${appId}_agent_v3_sessions" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_${appId}_agent_v3_sessions_team_id" ON "${appId}_agent_v3_sessions" ("team_id") `);
    await queryRunner.query(`CREATE INDEX "idx_${appId}_agent_v3_sessions_user_id" ON "${appId}_agent_v3_sessions" ("user_id") `);
    await queryRunner.query(`CREATE INDEX "idx_${appId}_agent_v3_sessions_title" ON "${appId}_agent_v3_sessions" ("title") `);
    await queryRunner.query(`CREATE INDEX "idx_${appId}_agent_v3_sessions_model_id" ON "${appId}_agent_v3_sessions" ("model_id") `);
    await queryRunner.query(`CREATE INDEX "idx_${appId}_agent_v3_sessions_team_updated_ts" ON "${appId}_agent_v3_sessions" ("team_id", "updated_timestamp") `);
    await queryRunner.query(`CREATE INDEX "idx_${appId}_agent_v3_sessions_team_user" ON "${appId}_agent_v3_sessions" ("team_id", "user_id") `);

    await queryRunner.query(
      `CREATE TABLE "${appId}_agent_v3_messages" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "session_id" character varying NOT NULL, "team_id" character varying NOT NULL, "role" character varying NOT NULL, "content" text, "tool_call_id" character varying, "tool_name" character varying, "tool_input" text, "tool_output" text, "model_id" character varying, "sequence" integer NOT NULL, CONSTRAINT "pk_${appId}_agent_v3_messages" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_${appId}_agent_v3_messages_session_id" ON "${appId}_agent_v3_messages" ("session_id") `);
    await queryRunner.query(`CREATE INDEX "idx_${appId}_agent_v3_messages_team_id" ON "${appId}_agent_v3_messages" ("team_id") `);
    await queryRunner.query(`CREATE INDEX "idx_${appId}_agent_v3_messages_role" ON "${appId}_agent_v3_messages" ("role") `);
    await queryRunner.query(`CREATE INDEX "idx_${appId}_agent_v3_messages_tool_call_id" ON "${appId}_agent_v3_messages" ("tool_call_id") `);
    await queryRunner.query(`CREATE INDEX "idx_${appId}_agent_v3_messages_tool_name" ON "${appId}_agent_v3_messages" ("tool_name") `);
    await queryRunner.query(`CREATE INDEX "idx_${appId}_agent_v3_messages_model_id" ON "${appId}_agent_v3_messages" ("model_id") `);
    await queryRunner.query(`CREATE INDEX "idx_${appId}_agent_v3_messages_team_created_ts" ON "${appId}_agent_v3_messages" ("team_id", "created_timestamp") `);
    await queryRunner.query(`CREATE INDEX "idx_${appId}_agent_v3_messages_session_created_ts" ON "${appId}_agent_v3_messages" ("session_id", "created_timestamp") `);
    await queryRunner.query(`CREATE INDEX "idx_${appId}_agent_v3_messages_session_sequence" ON "${appId}_agent_v3_messages" ("session_id", "sequence") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_${appId}_agent_v3_messages_session_sequence"`);
    await queryRunner.query(`DROP INDEX "public"."idx_${appId}_agent_v3_messages_session_created_ts"`);
    await queryRunner.query(`DROP INDEX "public"."idx_${appId}_agent_v3_messages_team_created_ts"`);
    await queryRunner.query(`DROP INDEX "public"."idx_${appId}_agent_v3_messages_model_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_${appId}_agent_v3_messages_tool_name"`);
    await queryRunner.query(`DROP INDEX "public"."idx_${appId}_agent_v3_messages_tool_call_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_${appId}_agent_v3_messages_role"`);
    await queryRunner.query(`DROP INDEX "public"."idx_${appId}_agent_v3_messages_team_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_${appId}_agent_v3_messages_session_id"`);
    await queryRunner.query(`DROP TABLE "${appId}_agent_v3_messages"`);

    await queryRunner.query(`DROP INDEX "public"."idx_${appId}_agent_v3_sessions_team_user"`);
    await queryRunner.query(`DROP INDEX "public"."idx_${appId}_agent_v3_sessions_team_updated_ts"`);
    await queryRunner.query(`DROP INDEX "public"."idx_${appId}_agent_v3_sessions_model_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_${appId}_agent_v3_sessions_title"`);
    await queryRunner.query(`DROP INDEX "public"."idx_${appId}_agent_v3_sessions_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_${appId}_agent_v3_sessions_team_id"`);
    await queryRunner.query(`DROP TABLE "${appId}_agent_v3_sessions"`);
  }
}
