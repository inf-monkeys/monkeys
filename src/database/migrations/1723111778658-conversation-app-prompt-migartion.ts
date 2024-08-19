import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

export class MigartionConversationAppPromptMigartion1723111778658 implements MigrationInterface {
  tableName = `${appId}_conversation_apps`;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "${this.tableName}"
            ALTER COLUMN "system_prompt" TYPE text
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "${this.tableName}"
            ALTER COLUMN "system_prompt" TYPE varchar
        `);
  }
}
