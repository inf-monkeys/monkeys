import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class Migration1756869403926 implements MigrationInterface {
  name = 'Migration1756869403926';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."${appId}_agent_v2_task_states_status_enum" AS ENUM('pending', 'running', 'waiting_for_approval', 'completed', 'error', 'stopped')`);
    await queryRunner.query(
      `CREATE TABLE "${appId}_agent_v2_task_states" ("id" character varying(128) NOT NULL, "session_id" character varying(128) NOT NULL, "status" "public"."${appId}_agent_v2_task_states_status_enum" NOT NULL DEFAULT 'pending', "current_loop_count" integer NOT NULL DEFAULT '0', "consecutive_mistake_count" integer NOT NULL DEFAULT '0', "last_processed_message_id" character varying(128), "processing_context" jsonb, "execution_metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bd612bad207d92660f3947cdbd3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_5018e76f47b667471c2928e459" ON "${appId}_agent_v2_task_states" ("session_id", "last_processed_message_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_54de288ff37a1bf61f24d1f8a8" ON "${appId}_agent_v2_task_states" ("status", "updated_at") `);
    await queryRunner.query(`CREATE INDEX "IDX_cdbce59ba449e1402d3b5e5d0b" ON "${appId}_agent_v2_task_states" ("session_id", "updated_at") `);
    await queryRunner.query(`CREATE INDEX "IDX_6cc37f7aabed6db4110bb6d338" ON "${appId}_agent_v2_task_states" ("session_id", "status") `);
    await queryRunner.query(`CREATE INDEX "IDX_fc2c004161e27e3778d8e8fbea" ON "${appId}_agent_v2_task_states" ("session_id") `);
    await queryRunner.query(`CREATE TYPE "public"."${appId}_agent_v2_message_queue_status_enum" AS ENUM('queued', 'processing', 'processed', 'failed')`);
    await queryRunner.query(
      `CREATE TABLE "${appId}_agent_v2_message_queue" ("id" character varying(128) NOT NULL, "session_id" character varying(128) NOT NULL, "message_id" character varying(128) NOT NULL, "content" text NOT NULL, "sender_id" character varying(255) NOT NULL, "status" "public"."${appId}_agent_v2_message_queue_status_enum" NOT NULL DEFAULT 'queued', "processing_attempts" integer NOT NULL DEFAULT '0', "processed_at" TIMESTAMP, "error_message" text, "processing_result" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_415bb3c8c49bc3f7cdf4777e106" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_a2a91a1bae77a3f52c05a66989" ON "${appId}_agent_v2_message_queue" ("status", "processing_attempts", "updated_at") `);
    await queryRunner.query(`CREATE INDEX "IDX_b4a3d0585ad82a8a1d89137402" ON "${appId}_agent_v2_message_queue" ("message_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_d16f738b7f0c57d4482e0567d5" ON "${appId}_agent_v2_message_queue" ("session_id", "processed_at") `);
    await queryRunner.query(`CREATE INDEX "IDX_898735145acfd15336cee7a26e" ON "${appId}_agent_v2_message_queue" ("status", "created_at") `);
    await queryRunner.query(`CREATE INDEX "IDX_363caff26990baf37a929762c7" ON "${appId}_agent_v2_message_queue" ("session_id", "created_at") `);
    await queryRunner.query(`CREATE INDEX "IDX_b6360b91990b6b12d65166a23f" ON "${appId}_agent_v2_message_queue" ("session_id", "status", "created_at") `);
    await queryRunner.query(
      `CREATE TABLE "${appId}_agent_v2" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying NOT NULL, "description" character varying, "team_id" character varying NOT NULL, "created_by" character varying NOT NULL, "icon_url" character varying, "config" json, CONSTRAINT "PK_bc3e510f41b7d4c379039663f72" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_d0f851b6fd27f76f9e57a40efa" ON "${appId}_agent_v2" ("created_by") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_dfa6ee865d4934b683b63a63bc" ON "${appId}_agent_v2" ("team_id", "name") `);
    await queryRunner.query(
      `CREATE TABLE "${appId}_agent_v2_sessions" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "agent_id" character varying NOT NULL, "user_id" character varying NOT NULL, "title" character varying, "metadata" json, CONSTRAINT "PK_fa50137bcb62d0cd3aaa9a63dc2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_e5fe6e0d09c376680ba266819f" ON "${appId}_agent_v2_sessions" ("agent_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_55d769ca3ba7182e5a54b7a7a7" ON "${appId}_agent_v2_sessions" ("user_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_6a6f86221a2fc7bf3aae7581f1" ON "${appId}_agent_v2_sessions" ("title") `);
    await queryRunner.query(
      `CREATE TABLE "${appId}_agent_v2_messages" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "session_id" character varying NOT NULL, "sender_id" character varying NOT NULL, "content" text NOT NULL, "toolCalls" json, "isSystem" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_eee2159b16da7a2bf0b1772d5de" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_b518ce9b3d029d30319dc59731" ON "${appId}_agent_v2_messages" ("session_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_29bd77c4e5f053cdd8a2d77f4c" ON "${appId}_agent_v2_messages" ("sender_id") `);
    await queryRunner.query(
      `ALTER TABLE "${appId}_agent_v2" ADD CONSTRAINT "FK_27dce19e1f7fe2ba1772025836d" FOREIGN KEY ("team_id") REFERENCES "${appId}_teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${appId}_agent_v2" ADD CONSTRAINT "FK_d0f851b6fd27f76f9e57a40efab" FOREIGN KEY ("created_by") REFERENCES "${appId}_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${appId}_agent_v2_sessions" ADD CONSTRAINT "FK_e5fe6e0d09c376680ba266819f9" FOREIGN KEY ("agent_id") REFERENCES "${appId}_agent_v2"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${appId}_agent_v2_sessions" ADD CONSTRAINT "FK_55d769ca3ba7182e5a54b7a7a78" FOREIGN KEY ("user_id") REFERENCES "${appId}_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${appId}_agent_v2_messages" ADD CONSTRAINT "FK_b518ce9b3d029d30319dc597317" FOREIGN KEY ("session_id") REFERENCES "${appId}_agent_v2_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "${appId}_agent_v2_messages" ADD CONSTRAINT "FK_29bd77c4e5f053cdd8a2d77f4c6" FOREIGN KEY ("sender_id") REFERENCES "${appId}_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${appId}_agent_v2_messages" DROP CONSTRAINT "FK_29bd77c4e5f053cdd8a2d77f4c6"`);
    await queryRunner.query(`ALTER TABLE "${appId}_agent_v2_messages" DROP CONSTRAINT "FK_b518ce9b3d029d30319dc597317"`);
    await queryRunner.query(`ALTER TABLE "${appId}_agent_v2_sessions" DROP CONSTRAINT "FK_55d769ca3ba7182e5a54b7a7a78"`);
    await queryRunner.query(`ALTER TABLE "${appId}_agent_v2_sessions" DROP CONSTRAINT "FK_e5fe6e0d09c376680ba266819f9"`);
    await queryRunner.query(`ALTER TABLE "${appId}_agent_v2" DROP CONSTRAINT "FK_d0f851b6fd27f76f9e57a40efab"`);
    await queryRunner.query(`ALTER TABLE "${appId}_agent_v2" DROP CONSTRAINT "FK_27dce19e1f7fe2ba1772025836d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_29bd77c4e5f053cdd8a2d77f4c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b518ce9b3d029d30319dc59731"`);
    await queryRunner.query(`DROP TABLE "${appId}_agent_v2_messages"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6a6f86221a2fc7bf3aae7581f1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_55d769ca3ba7182e5a54b7a7a7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e5fe6e0d09c376680ba266819f"`);
    await queryRunner.query(`DROP TABLE "${appId}_agent_v2_sessions"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_dfa6ee865d4934b683b63a63bc"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d0f851b6fd27f76f9e57a40efa"`);
    await queryRunner.query(`DROP TABLE "${appId}_agent_v2"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b6360b91990b6b12d65166a23f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_363caff26990baf37a929762c7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_898735145acfd15336cee7a26e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d16f738b7f0c57d4482e0567d5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b4a3d0585ad82a8a1d89137402"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a2a91a1bae77a3f52c05a66989"`);
    await queryRunner.query(`DROP TABLE "${appId}_agent_v2_message_queue"`);
    await queryRunner.query(`DROP TYPE "public"."${appId}_agent_v2_message_queue_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fc2c004161e27e3778d8e8fbea"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6cc37f7aabed6db4110bb6d338"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cdbce59ba449e1402d3b5e5d0b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_54de288ff37a1bf61f24d1f8a8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5018e76f47b667471c2928e459"`);
    await queryRunner.query(`DROP TABLE "${appId}_agent_v2_task_states"`);
    await queryRunner.query(`DROP TYPE "public"."${appId}_agent_v2_task_states_status_enum"`);
  }
}
