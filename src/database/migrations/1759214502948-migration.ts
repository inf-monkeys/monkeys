import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class Migration1759214502948 implements MigrationInterface {
  name = 'Migration1759214502948';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."${appId}_vr_evaluation_tasks_status_enum" AS ENUM('pending', 'completed')`);
    await queryRunner.query(
      `CREATE TABLE "${appId}_vr_evaluation_tasks" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "task_name" character varying(500) NOT NULL, "thumbnail_url" text, "model_url" text NOT NULL, "status" "public"."${appId}_vr_evaluation_tasks_status_enum" NOT NULL DEFAULT 'pending', "evaluation_result" jsonb, "evaluated_at" TIMESTAMP, "created_by" character varying, CONSTRAINT "PK_${appId}_cb39b673f41b01cdcf49e148cd8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_ba8aef145f597b0bac18decd55" ON "${appId}_vr_evaluation_tasks" ("team_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_5fbdd1d614c320f1187a582072" ON "${appId}_vr_evaluation_tasks" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_${appId}_25023da19cba80e93352f7ffc1" ON "${appId}_vr_evaluation_tasks" ("team_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_25023da19cba80e93352f7ffc1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_5fbdd1d614c320f1187a582072"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_${appId}_ba8aef145f597b0bac18decd55"`);
    await queryRunner.query(`DROP TABLE "${appId}_vr_evaluation_tasks"`);
    await queryRunner.query(`DROP TYPE "public"."${appId}_vr_evaluation_tasks_status_enum"`);
  }
}
