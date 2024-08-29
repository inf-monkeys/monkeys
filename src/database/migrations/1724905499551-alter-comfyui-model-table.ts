import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class MigartionAlterComfyuiModelTable1724905499551 implements MigrationInterface {
  relationTable = `${appId}_comfyui_model_server_relations`;
  modelTable = `${appId}_comfyui_model`;
  serverTable = `${appId}_comfyui_servers`;

  public async up(queryRunner: QueryRunner): Promise<void> {
    const fks: { constraint_name: string }[] = await queryRunner.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = '${this.relationTable}'
        AND constraint_type = 'FOREIGN KEY'
    `);

    if (fks.length === 2) {
      await queryRunner.query(`
            ALTER TABLE "public"."${this.relationTable}" 
            DROP CONSTRAINT "${fks[0].constraint_name}",
            DROP CONSTRAINT "${fks[1].constraint_name}",
            ADD CONSTRAINT "${fks[0].constraint_name}" FOREIGN KEY ("modelId") REFERENCES "public"."${this.modelTable}" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
            ADD CONSTRAINT "${fks[1].constraint_name}" FOREIGN KEY ("serverId") REFERENCES "public"."${this.serverTable}" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `);
    }

    await queryRunner.query(`
        ALTER TABLE "public"."${this.relationTable}" 
        ALTER COLUMN "team_id" DROP NOT NULL;`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
