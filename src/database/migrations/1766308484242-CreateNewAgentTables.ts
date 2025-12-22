import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class CreateNewAgentTables1766308484242 implements MigrationInterface {
  name = 'CreateNewAgentTables1766308484242';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========== Create agents table ==========
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "${appId}_agent_agents" (
        "id" varchar(128) PRIMARY KEY,
        "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        "is_deleted" boolean NOT NULL DEFAULT false,
        "name" varchar(255) NOT NULL,
        "description" text,
        "team_id" varchar(128) NOT NULL,
        "created_by" varchar(128) NOT NULL,
        "icon_url" varchar,
        "config" jsonb NOT NULL
      )
    `);

    // ========== Create threads table ==========
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "${appId}_agent_threads" (
        "id" varchar(128) PRIMARY KEY,
        "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        "is_deleted" boolean NOT NULL DEFAULT false,
        "agent_id" varchar(128),
        "team_id" varchar(128) NOT NULL,
        "user_id" varchar(128) NOT NULL,
        "title" varchar(500),
        "metadata" jsonb,
        "state" jsonb,
        "last_message_at" TIMESTAMP
      )
    `);

    // ========== Create messages table ==========
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "${appId}_agent_messages" (
        "id" varchar(128) PRIMARY KEY,
        "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        "is_deleted" boolean NOT NULL DEFAULT false,
        "thread_id" varchar(128) NOT NULL,
        "team_id" varchar(128) NOT NULL,
        "role" varchar(20) NOT NULL,
        "parts" jsonb NOT NULL,
        "metadata" jsonb,
        "parent_id" varchar(128),
        "branch_id" varchar(128)
      )
    `);

    // ========== Create tools table ==========
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "${appId}_agent_tools" (
        "id" varchar(128) PRIMARY KEY,
        "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        "is_deleted" boolean NOT NULL DEFAULT false,
        "team_id" varchar(128) NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text NOT NULL,
        "input_schema" jsonb NOT NULL,
        "category" varchar(50),
        "needs_approval" boolean NOT NULL DEFAULT false,
        "approval_policy" jsonb,
        "is_public" boolean NOT NULL DEFAULT false,
        "version" varchar(50),
        "icon_url" varchar
      )
    `);

    // ========== Create tool_calls table ==========
    await queryRunner.query(`
      CREATE TYPE "${appId}_agent_tool_calls_status_enum" AS ENUM ('pending', 'running', 'completed', 'error', 'timeout')
    `);
    await queryRunner.query(`
      CREATE TYPE "${appId}_agent_tool_calls_approval_status_enum" AS ENUM ('not_required', 'pending', 'approved', 'rejected')
    `);
    await queryRunner.query(`
      CREATE TABLE "${appId}_agent_tool_calls" (
        "id" varchar(128) PRIMARY KEY,
        "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        "is_deleted" boolean NOT NULL DEFAULT false,
        "tool_call_id" varchar(128) UNIQUE NOT NULL,
        "thread_id" varchar(128) NOT NULL,
        "message_id" varchar(128) NOT NULL,
        "team_id" varchar(128) NOT NULL,
        "tool_name" varchar(255) NOT NULL,
        "input" jsonb NOT NULL,
        "output" jsonb,
        "status" "${appId}_agent_tool_calls_status_enum" NOT NULL DEFAULT 'pending',
        "is_error" boolean NOT NULL DEFAULT false,
        "error_text" text,
        "approval_status" "${appId}_agent_tool_calls_approval_status_enum" NOT NULL DEFAULT 'not_required',
        "approved_by" varchar(128),
        "approved_at" TIMESTAMP,
        "duration" integer
      )
    `);

    // ========== Create indexes for agents ==========
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_${appId}_agents_team_name"
      ON "${appId}_agent_agents" ("team_id", "name")
      WHERE "is_deleted" = false
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_agents_list"
      ON "${appId}_agent_agents" ("team_id", "is_deleted", "updated_timestamp" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_agents_model"
      ON "${appId}_agent_agents" USING GIN ((config->'model'))
    `);

    // ========== Create indexes for threads ==========
    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_threads_user_list"
      ON "${appId}_agent_threads" ("team_id", "user_id", "last_message_at" DESC NULLS LAST)
      WHERE "is_deleted" = false
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_threads_agent_stats"
      ON "${appId}_agent_threads" ("agent_id", "updated_timestamp" DESC)
      WHERE "agent_id" IS NOT NULL AND "is_deleted" = false
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_threads_active"
      ON "${appId}_agent_threads" USING GIN ("state")
      WHERE (state->>'isRunning')::boolean = true
    `);

    // ========== Create indexes for messages ==========
    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_messages_thread_time"
      ON "${appId}_agent_messages" ("thread_id", "created_timestamp" ASC)
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_messages_branches"
      ON "${appId}_agent_messages" ("thread_id", "parent_id")
      WHERE "parent_id" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_messages_branch"
      ON "${appId}_agent_messages" ("thread_id", "branch_id", "created_timestamp")
      WHERE "branch_id" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_messages_tool_calls"
      ON "${appId}_agent_messages" USING GIN ("parts")
      WHERE jsonb_typeof(parts) = 'array'
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_messages_team_stats"
      ON "${appId}_agent_messages" ("team_id", date_trunc('day', "created_timestamp"))
    `);

    // ========== Create indexes for tools ==========
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_${appId}_tools_team_name"
      ON "${appId}_agent_tools" ("team_id", "name")
      WHERE "is_deleted" = false
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_tools_team"
      ON "${appId}_agent_tools" ("team_id", "is_deleted")
      WHERE "is_deleted" = false
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_tools_public"
      ON "${appId}_agent_tools" ("is_public", "category")
      WHERE "is_public" = true
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_tools_approval"
      ON "${appId}_agent_tools" ("needs_approval")
      WHERE "needs_approval" = true
    `);

    // ========== Create indexes for tool_calls ==========
    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_tool_calls_thread"
      ON "${appId}_agent_tool_calls" ("thread_id", "created_timestamp" DESC)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_${appId}_tool_calls_id"
      ON "${appId}_agent_tool_calls" ("tool_call_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_tool_calls_stats"
      ON "${appId}_agent_tool_calls" ("tool_name", "status", "created_timestamp")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_tool_calls_pending_approval"
      ON "${appId}_agent_tool_calls" ("approval_status", "created_timestamp")
      WHERE "approval_status" = 'pending'
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_${appId}_tool_calls_errors"
      ON "${appId}_agent_tool_calls" ("is_error", "created_timestamp" DESC)
      WHERE "is_error" = true
    `);

    // ========== Add foreign keys ==========
    // agents foreign keys
    await queryRunner.query(`
      ALTER TABLE "${appId}_agent_agents"
      ADD CONSTRAINT "fk_${appId}_agents_team"
      FOREIGN KEY ("team_id") REFERENCES "${appId}_teams"("id")
    `);
    await queryRunner.query(`
      ALTER TABLE "${appId}_agent_agents"
      ADD CONSTRAINT "fk_${appId}_agents_creator"
      FOREIGN KEY ("created_by") REFERENCES "${appId}_users"("id")
    `);

    // threads foreign keys
    await queryRunner.query(`
      ALTER TABLE "${appId}_agent_threads"
      ADD CONSTRAINT "fk_${appId}_threads_agent"
      FOREIGN KEY ("agent_id") REFERENCES "${appId}_agent_agents"("id")
    `);
    await queryRunner.query(`
      ALTER TABLE "${appId}_agent_threads"
      ADD CONSTRAINT "fk_${appId}_threads_team"
      FOREIGN KEY ("team_id") REFERENCES "${appId}_teams"("id")
    `);
    await queryRunner.query(`
      ALTER TABLE "${appId}_agent_threads"
      ADD CONSTRAINT "fk_${appId}_threads_user"
      FOREIGN KEY ("user_id") REFERENCES "${appId}_users"("id")
    `);

    // messages foreign keys
    await queryRunner.query(`
      ALTER TABLE "${appId}_agent_messages"
      ADD CONSTRAINT "fk_${appId}_messages_thread"
      FOREIGN KEY ("thread_id") REFERENCES "${appId}_agent_threads"("id")
    `);
    await queryRunner.query(`
      ALTER TABLE "${appId}_agent_messages"
      ADD CONSTRAINT "fk_${appId}_messages_parent"
      FOREIGN KEY ("parent_id") REFERENCES "${appId}_agent_messages"("id")
    `);

    // tool_calls foreign keys
    await queryRunner.query(`
      ALTER TABLE "${appId}_agent_tool_calls"
      ADD CONSTRAINT "fk_${appId}_tool_calls_thread"
      FOREIGN KEY ("thread_id") REFERENCES "${appId}_agent_threads"("id")
    `);
    await queryRunner.query(`
      ALTER TABLE "${appId}_agent_tool_calls"
      ADD CONSTRAINT "fk_${appId}_tool_calls_message"
      FOREIGN KEY ("message_id") REFERENCES "${appId}_agent_messages"("id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(`ALTER TABLE "${appId}_agent_tool_calls" DROP CONSTRAINT IF EXISTS "fk_${appId}_tool_calls_message"`);
    await queryRunner.query(`ALTER TABLE "${appId}_agent_tool_calls" DROP CONSTRAINT IF EXISTS "fk_${appId}_tool_calls_thread"`);
    await queryRunner.query(`ALTER TABLE "${appId}_agent_messages" DROP CONSTRAINT IF EXISTS "fk_${appId}_messages_parent"`);
    await queryRunner.query(`ALTER TABLE "${appId}_agent_messages" DROP CONSTRAINT IF EXISTS "fk_${appId}_messages_thread"`);
    await queryRunner.query(`ALTER TABLE "${appId}_agent_threads" DROP CONSTRAINT IF EXISTS "fk_${appId}_threads_user"`);
    await queryRunner.query(`ALTER TABLE "${appId}_agent_threads" DROP CONSTRAINT IF EXISTS "fk_${appId}_threads_team"`);
    await queryRunner.query(`ALTER TABLE "${appId}_agent_threads" DROP CONSTRAINT IF EXISTS "fk_${appId}_threads_agent"`);
    await queryRunner.query(`ALTER TABLE "${appId}_agent_agents" DROP CONSTRAINT IF EXISTS "fk_${appId}_agents_creator"`);
    await queryRunner.query(`ALTER TABLE "${appId}_agent_agents" DROP CONSTRAINT IF EXISTS "fk_${appId}_agents_team"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "${appId}_agent_tool_calls"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "${appId}_agent_tools"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "${appId}_agent_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "${appId}_agent_threads"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "${appId}_agent_agents"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "${appId}_agent_tool_calls_approval_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "${appId}_agent_tool_calls_status_enum"`);
  }
}
