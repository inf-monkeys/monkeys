import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class MigartionRemoveBuiltInComfyuiWorkflow1717660927388 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const comfyuiWorkflowIds = ['664e1fa3103d67fd8406a5f3', '664e1fa3103d67fd8406a5f4'];
    await queryRunner.query(`DELETE FROM ${appId}_comfyui_workflows WHERE "id" IN ('${comfyuiWorkflowIds.join("','")}')`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Do nothing
  }
}
