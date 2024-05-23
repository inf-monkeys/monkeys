import { QueryRunner } from 'typeorm';

export const isColumnExist = async (columnName: string, tableName: string, queryRunner: QueryRunner) => {
  const table = await queryRunner.getTable(tableName);
  const column = table?.columns.find((c) => c.name === columnName);
  if (column) {
    return true;
  } else {
    return false;
  }
};

export const isIndexExist = async (indexName: string, tableName: string, queryRunner: QueryRunner) => {
  const table = await queryRunner.getTable(tableName);
  const index = table?.indices.find((i) => i.name === indexName);
  if (index) {
    return true;
  } else {
    return false;
  }
};

export const isTableExist = async (tableName: string, queryRunner: QueryRunner) => {
  const table = await queryRunner.getTable(tableName);
  if (table) {
    return true;
  } else {
    return false;
  }
};
