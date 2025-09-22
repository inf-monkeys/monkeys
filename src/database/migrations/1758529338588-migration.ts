import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class Migration1758529338588 implements MigrationInterface {
  name = 'Migration1758529338588';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."${appId}_model_training_status_enum" AS ENUM('idle', 'pending', 'running', 'completed', 'failed')`);
    await queryRunner.query(
      `CREATE TABLE "${appId}_model_training" ("id" character varying(128) NOT NULL, "created_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updated_timestamp" TIMESTAMP NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "display_name" jsonb NOT NULL, "description" jsonb, "status" "public"."${appId}_model_training_status_enum" NOT NULL, CONSTRAINT "PK_${appId}_80076e492c510c9714f182be766" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "${appId}_model_training"`);
    await queryRunner.query(`DROP TYPE "public"."${appId}_model_training_status_enum"`);
  }
}
