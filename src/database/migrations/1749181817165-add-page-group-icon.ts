import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1749181817165 implements MigrationInterface {
  name = 'Migration1749181817165';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "monkeys_workflow_page_group" ADD "icon_url" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "monkeys_workflow_page_group" DROP COLUMN "icon_url"`);
  }
}
