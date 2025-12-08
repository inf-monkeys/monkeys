import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class AddThumbnailUrlToDesignMetadata1761045006592 implements MigrationInterface {
  name = 'AddThumbnailUrlToDesignMetadata1761045006592';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${appId}_design_metadata" ADD "thumbnail_url" varchar`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${appId}_design_metadata" DROP COLUMN "thumbnail_url"`);
  }
}
