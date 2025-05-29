const CURRENT_TIMESTAMP = +new Date();

export const NOT_NULL = {
  isNullable: false,
};

export const NULLABLE = {
  isNullable: true,
};

export const VARCHAR = {
  type: 'varchar',
};

export const BOOL = {
  type: 'bool',
};

export const TEXT = {
  type: 'text',
};

export const SMALL_INT = {
  type: 'smallint',
};

export const INT = {
  type: 'int',
};

export const LONG_INT = {
  type: 'bigint',
};

export const TIMESTAMP = {
  type: 'timestamp',
};

export const JSON = {
  type: 'json',
};

export const ID = {
  name: 'id',
  type: 'varchar',
  isNullable: false,
  isPrimary: true,
  length: '128',
};

export const CREATED_TIMESTAMP = {
  name: 'created_timestamp',
  type: 'bigint',
  isNullable: false,
  default: CURRENT_TIMESTAMP,
};

export const UPDATED_TIMESTAMP = {
  name: 'updated_timestamp',
  type: 'bigint',
  isNullable: false,
  default: CURRENT_TIMESTAMP,
};

export const IS_DELETED = {
  name: 'is_deleted',
  type: 'boolean',
  isNullable: false,
  default: false,
};

export const TEAM_ID = {
  name: 'team_id',
  type: 'varchar',
  isNullable: true,
  length: '128',
};

export const CREATOR_USER_ID = {
  name: 'creator_user_id',
  type: 'varchar',
  isNullable: true,
  length: '128',
};

export const ICON_URL = {
  name: 'icon_url',
  type: 'varchar',
  isNullable: true,
  length: '512',
};

export const DISPLAY_NAME = {
  name: 'display_name',
  type: 'varchar',
  isNullable: true,
  length: '128',
};

export const DESCRIPTION = {
  name: 'description',
  type: 'text',
  isNullable: true,
};

export const IS_PRESET = {
  name: 'is_preset',
  type: 'boolean',
  isNullable: false,
  default: false,
};

export const IS_PUBLISHED = {
  name: 'is_published',
  type: 'boolean',
  isNullable: false,
  default: false,
};

export const PUBLISH_CONFIG = {
  name: 'publish_config',
  type: 'text',
  isNullable: true,
};

export const COMMON_COLUMNS = [ID, CREATED_TIMESTAMP, UPDATED_TIMESTAMP, IS_DELETED];

export const ASSET_COMMON_COLUMNS = [ID, CREATED_TIMESTAMP, UPDATED_TIMESTAMP, IS_DELETED, TEAM_ID, CREATOR_USER_ID, ICON_URL, DISPLAY_NAME, DESCRIPTION, IS_PRESET, IS_PUBLISHED, PUBLISH_CONFIG];
