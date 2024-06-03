import { AssetType } from '@/common/typings/asset';
import { BaseAssetEntity } from '@/database/entities/assets/base-asset';
import { Column, Entity } from 'typeorm';

export enum SqlKnowledgeBaseCreateType {
  builtIn = 'builtIn',
  external = 'external',
}

export enum ExternalSqlDatabaseType {
  mysql = 'mysql',
  postgres = 'postgres',
}

export interface ExternalSqlDatabaseConnectionOptions {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  schema?: string;
}

export interface CreateSqlKnowledgeBaseParams {
  createType: SqlKnowledgeBaseCreateType;
  externalDatabaseType?: ExternalSqlDatabaseType;
  externalDatabaseConnectionOptions?: ExternalSqlDatabaseConnectionOptions;
  displayName?: string;
  description?: string;
  iconUrl?: string;
}

@Entity({ name: 'knowledge_bases_sql' })
export class SqlKnowLedgeBaseEntity extends BaseAssetEntity {
  assetType: AssetType = 'knowledge-base-sql';

  @Column({})
  uuid: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'create_type',
    default: SqlKnowledgeBaseCreateType.builtIn,
  })
  createType: SqlKnowledgeBaseCreateType;
}
