import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

const tableName = `${appId}_workflow_associations`;
const tableName2 = `${appId}_workflow_metadatas`;

const fkName = `FK_${appId}_9ccbabc8e32c74e347dbaea384a`;
const fallbackFkName = `FK_9ccbabc8e32c74e347dbaea384a`;

export class Migration1750318061337 implements MigrationInterface {
  name = 'Migration1750318061337';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${tableName}" ADD "type" character varying`);
    await queryRunner.query(`UPDATE "${tableName}" SET "type" = 'to-workflow'`);
    await queryRunner.query(`ALTER TABLE "${tableName}" ALTER COLUMN "type" SET NOT NULL`);

    // 检查外键是否存在
    const hasConstraint =
      (await queryRunner.hasTable(tableName)) &&
      (await queryRunner.query(
        `SELECT 1 FROM information_schema.table_constraints 
       WHERE constraint_name = '${fkName}' AND table_name = '${tableName}'`,
      ));
    const constraintName = hasConstraint.length > 0 ? fkName : fallbackFkName;

    await queryRunner.query(`ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${constraintName}"`);
    await queryRunner.query(`ALTER TABLE "${tableName}" ALTER COLUMN "target_workflow_id" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "${tableName}" ALTER COLUMN "mapper" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${fkName}" FOREIGN KEY ("target_workflow_id") REFERENCES "${tableName2}"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 检查外键是否存在
    const hasConstraint =
      (await queryRunner.hasTable(tableName)) &&
      (await queryRunner.query(
        `SELECT 1 FROM information_schema.table_constraints 
       WHERE constraint_name = '${fkName}' AND table_name = '${tableName}'`,
      ));
    const constraintName = hasConstraint.length > 0 ? fkName : fallbackFkName;

    await queryRunner.query(`ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${constraintName}"`);
    await queryRunner.query(`ALTER TABLE "${tableName}" ALTER COLUMN "mapper" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "${tableName}" ALTER COLUMN "target_workflow_id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${fkName}" FOREIGN KEY ("target_workflow_id") REFERENCES "${tableName2}"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN "type"`);
  }
}
