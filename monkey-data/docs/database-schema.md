# 数据库结构（V2）

## 命名规则
- 表名：`${app_id}_${base}_v2`，例如 `monkeys_data_assets_v2`。
- `app_id` 由请求头 `X-App-Id` 传入（用于选择表前缀）。
- `team_id` 为强制过滤条件（查询必须带入）。

## PostgreSQL 表

### data_assets_v2
资源主表（软删除）。
- `id` varchar(128) PK
- `team_id` varchar(128) NOT NULL
- `creator_user_id` varchar(128) NULL
- `name` varchar(500) NOT NULL
- `asset_type` varchar(50) NOT NULL
- `primary_content` jsonb NOT NULL
- `properties` jsonb NULL
- `files` jsonb NULL
- `media` varchar(500) NULL
- `thumbnail` varchar(500) NULL
- `keywords` text NULL（不参与 tag 筛选）
- `status` varchar(20) NOT NULL DEFAULT 'draft'
- `extra` jsonb NULL
- `created_timestamp` bigint NOT NULL
- `updated_timestamp` bigint NOT NULL
- `is_deleted` boolean NOT NULL DEFAULT false

索引：
- `idx_${app_id}_data_assets_v2_team_updated`（`team_id`, `updated_timestamp` DESC, `id` DESC）

### data_tags_v2
标签字典表（同名允许）。
- `id` varchar(128) PK
- `team_id` varchar(128) NOT NULL
- `name` varchar(255) NOT NULL
- `name_norm` varchar(255) NOT NULL（lowercase 规范化）
- `color` varchar(50) NULL
- `extra` jsonb NULL
- `created_timestamp` bigint NOT NULL
- `updated_timestamp` bigint NOT NULL
- `is_deleted` boolean NOT NULL DEFAULT false

索引：
- `idx_${app_id}_data_tags_v2_team_norm`（`team_id`, `name_norm`）
- `idx_${app_id}_data_tags_v2_team_name`（`team_id`, `name`）

### data_asset_tag_relations_v2
资源与标签多对多关联表。
- `id` varchar(128) PK
- `team_id` varchar(128) NOT NULL
- `asset_id` varchar(128) NOT NULL
- `tag_id` varchar(128) NOT NULL
- `created_timestamp` bigint NOT NULL
- `updated_timestamp` bigint NOT NULL
- `is_deleted` boolean NOT NULL DEFAULT false

约束/索引：
- 唯一约束：`(team_id, asset_id, tag_id)`
- `idx_${app_id}_data_asset_tag_relations_v2_tag`（`team_id`, `tag_id`, `asset_id`）
- `idx_${app_id}_data_asset_tag_relations_v2_asset`（`team_id`, `asset_id`）

### data_views_v2
视图（树形结构）。
- `id` varchar(128) PK
- `team_id` varchar(128) NULL（NULL 表示全局视图）
- `name` varchar(255) NOT NULL
- `description` text NULL
- `icon_url` varchar(500) NULL
- `parent_id` varchar(128) NULL
- `path` varchar(1000) NOT NULL
- `level` int NOT NULL DEFAULT 0
- `sort` int NOT NULL DEFAULT 0
- `display_config` jsonb NULL
- `created_timestamp` bigint NOT NULL
- `updated_timestamp` bigint NOT NULL
- `is_deleted` boolean NOT NULL DEFAULT false

索引：
- `idx_${app_id}_data_views_v2_parent`（`team_id`, `parent_id`）
- `idx_${app_id}_data_views_v2_path`（`team_id`, `path`）

### data_view_tag_relations_v2
视图与标签关系表。
- `id` varchar(128) PK
- `team_id` varchar(128) NOT NULL
- `view_id` varchar(128) NOT NULL
- `tag_id` varchar(128) NOT NULL
- `created_timestamp` bigint NOT NULL
- `updated_timestamp` bigint NOT NULL
- `is_deleted` boolean NOT NULL DEFAULT false

约束/索引：
- 唯一约束：`(team_id, view_id, tag_id)`
- `idx_${app_id}_data_view_tag_relations_v2_view`（`team_id`, `view_id`）

### data_outbox_events_v2
Outbox 事件（用于索引异步同步）。
- `event_id` bigserial PK
- `team_id` varchar(128) NOT NULL
- `aggregate_id` varchar(128) NOT NULL
- `event_type` varchar(50) NOT NULL（如 `asset.upsert` / `asset.delete`）
- `payload` jsonb NOT NULL
- `created_timestamp` bigint NOT NULL
- `processed_timestamp` bigint NULL
- `retry_count` int NOT NULL DEFAULT 0
- `locked_at` bigint NULL
- `locked_by` varchar(128) NULL

索引：
- `idx_${app_id}_data_outbox_events_v2_pending`（`event_id`，且 `processed_timestamp IS NULL`）

## Elasticsearch 索引结构
- 索引名：`${app_id}_data_assets_v2`
- 字段：
  - `asset_id` keyword
  - `team_id` keyword
  - `tag_ids` keyword[]
  - `asset_type` keyword
  - `status` keyword
  - `created_timestamp` long
  - `updated_timestamp` long

排序规则：
- `updated_timestamp` DESC, `asset_id` DESC

分页规则：
- `search_after` + `page_token`
