import { QueryRunner } from 'typeorm';

export const isColumnExist = async (columnName: string, tableName: string, queryRunner: QueryRunner) => {
  const table = await queryRunner.getTable(tableName);
  const column = table?.columns.find((c) => c.name === columnName);
  return !!column;
};

export const isIndexExist = async (indexName: string, tableName: string, queryRunner: QueryRunner) => {
  const table = await queryRunner.getTable(tableName);
  const index = table?.indices.find((i) => i.name === indexName);
  return !!index;
};

export const isTableExist = async (tableName: string, queryRunner: QueryRunner) => {
  const table = await queryRunner.getTable(tableName);
  return !!table;
};
