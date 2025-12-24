# 数据管理 V2 草案

## 范围
- 新的 Go 模块（monkey-data）负责数据管理 V2 的 CRUD + 搜索。
- 不处理上传/预签名，资产仅保存引用信息。
- 权限由 NestJS 处理，Go 不做权限校验。

## 多租户
- PostgreSQL：按租户使用 app_id 前缀的表（与当前系统一致）。
- OpenSearch：按 app_id 前缀区分索引。
- 所有查询必须过滤 team_id，app_id 仅用于选择表/索引。

## 核心规则
- Tag 为平面结构（无层级），允许同名，筛选使用 tag_id。
- 资源与 tag 多对多。
- View 为树结构（parent_id/path/level/sort）。
- 单个 view 绑定多个 tag，组内 AND。
- 选中父 view 时，子 view 的 tag 组之间 OR。
- 用户追加 tag 采用 AND。
- 若选中的 view 没有绑定任何 tag，则默认检索全部（仅 team_id 过滤）。

## 表结构（后缀 _v2；实际表名 = ${appId}_<name>_v2）

### data_assets_v2
- id: varchar(128) PK
- team_id: varchar(128) not null
- creator_user_id: varchar(128) null
- name: varchar(500) not null
- asset_type: varchar(50) not null
- primary_content: jsonb not null
- properties: jsonb null
- files: jsonb null
- media: varchar(500) null
- thumbnail: varchar(500) null
- keywords: text null（不用于 tag 筛选）
- status: varchar(20) default 'draft'
- extra: jsonb null
- created_timestamp: bigint not null
- updated_timestamp: bigint not null
- is_deleted: boolean default false
索引：
- (team_id, updated_timestamp desc, id desc)
- (team_id, asset_type, updated_timestamp desc) 可选

### data_tags_v2
- id: varchar(128) PK
- team_id: varchar(128) not null
- name: varchar(255) not null
- name_norm: varchar(255) not null（lowercase，不唯一）
- color: varchar(50) null
- extra: jsonb null
- created_timestamp: bigint
- updated_timestamp: bigint
- is_deleted: boolean
索引：
- (team_id, name_norm)
- (team_id, name)

### data_asset_tag_relations_v2
- id: varchar(128) PK
- team_id: varchar(128) not null
- asset_id: varchar(128) not null
- tag_id: varchar(128) not null
- created_timestamp: bigint
- updated_timestamp: bigint
- is_deleted: boolean
约束/索引：
- unique (team_id, asset_id, tag_id)
- index (team_id, tag_id, asset_id)
- index (team_id, asset_id)

### data_views_v2
- id: varchar(128) PK
- team_id: varchar(128) null（NULL 或 '0' 表示全局视图）
- name: varchar(255) not null
- description: text null
- icon_url: varchar(500) null
- parent_id: varchar(128) null
- path: varchar(1000) not null
- level: int not null
- sort: int not null default 0
- display_config: jsonb null
- created_timestamp: bigint
- updated_timestamp: bigint
- is_deleted: boolean
索引：
- (team_id, parent_id)
- (team_id, path) + text_pattern_ops（用于前缀 LIKE）

### data_view_tag_relations_v2
- id: varchar(128) PK
- team_id: varchar(128) not null
- view_id: varchar(128) not null
- tag_id: varchar(128) not null
- created_timestamp: bigint
- updated_timestamp: bigint
- is_deleted: boolean
约束/索引：
- unique (team_id, view_id, tag_id)
- index (team_id, view_id)

### data_outbox_events_v2（可选，用于异步索引）
- event_id: bigserial PK
- team_id: varchar(128)
- aggregate_id: varchar(128)
- event_type: varchar(50)
- payload: jsonb
- created_timestamp: bigint
- processed_timestamp: bigint null
- retry_count: int default 0
- locked_at: bigint null
- locked_by: varchar(128) null

## 搜索语义
定义：
- viewTags(v) = 视图 v 绑定的 tag 集合（AND 组）
- subtree(V) = 选中 view 的子树（含自身）
- userTags = 用户追加 tag（AND 组）

若选中 view 无 tag：
- DefaultFilter = 空（匹配全部资产）
否则：
- DefaultFilter = OR_{v in subtree(V)} (AND_{t in viewTags(v)} hasTag(t))

最终过滤：
- FinalFilter = DefaultFilter AND (AND_{u in userTags} hasTag(u)) AND team_id=?

## ES 索引
索引名：${appId}_data_assets_v2
映射字段：
- asset_id (keyword)
- team_id (keyword)
- tag_ids (keyword[])
- asset_type (keyword)
- status (keyword)
- updated_timestamp (long)
- created_timestamp (long)

排序：updated_timestamp desc, asset_id desc
分页：search_after + page_token（可选 anchor）

## Go 内部 API 草案
- POST /v2/assets
- PATCH /v2/assets/{id}
- DELETE /v2/assets/{id}
- GET /v2/assets/{id}
- GET /v2/assets/search?view_id=...&tags=...&limit=...&page_token=...
- POST /v2/tags
- GET /v2/tags
- DELETE /v2/tags/{id}
- POST /v2/views
- PATCH /v2/views/{id}
- DELETE /v2/views/{id}
- GET /v2/views/tree
- PUT /v2/views/{id}/tags

请求头：
- X-App-Id（选择表/索引）
- X-Team-Id（过滤）
- X-Internal-Token（内网鉴权）

## Migration 方式
- 在主仓库新增 TypeORM migration，创建 *_v2 表（带 ${appId}_ 前缀）。
- 不改现有表结构。

## 备注 / 待确认
- 是否要求所有搜索都走 ES，或仅 tag 搜索走 ES。
- page_token 采用 HMAC 或服务端游标存储。
