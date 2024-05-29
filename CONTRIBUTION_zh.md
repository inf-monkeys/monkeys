# 开发指引

## 数据库 Migrations

当设计到表的改动时，需要创建 migrations 文件。

### 创建 Migrations 文件

1. 执行 `yarn migration:create` 命令，会自动在 `src/database/migrations/` 目录创建一个 migration 文件。
2. 重命名此 migration 文件，如 `timestamp-xxx-xxxx-migration.ts`，并修改 Migration 的 Class name，要求 Class Name 必须以时间戳结尾。
3. 注意事项：
- 创建的表名必须使用 `config.server.appId` 作为前缀。

### 执行 Migration

1. 执行 `yarn migration:run`

