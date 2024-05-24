import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class MigartionAddColumnLogEndpointForToolsServer1716551483943 implements MigrationInterface {
  tableName = `${appId}_tools_server`;
  columnName = 'log_endpoint';
  public async up(queryRunner: QueryRunner): Promise<void> {}

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
