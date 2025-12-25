# HTTP API 说明

## 基本约定
- 所有接口使用 JSON。
- `X-App-Id` 与 `X-Team-Id` 必填，用于多租户隔离与团队过滤。
- `X-Internal-Token` 仅在配置了 `internal_token` 或 `MONKEY_DATA_INTERNAL_TOKEN` 时要求。
- 响应格式统一为：
  - 成功：`{ "code": "OK", "data": ... }`
  - 失败：`{ "code": "INVALID_ARGUMENT", "data": { "message": "..." } }`

## 请求头
- `X-App-Id`: 租户标识（表前缀/索引名前缀）。
- `X-Team-Id`: 团队标识（强制过滤）。
- `X-Internal-Token`: 内部调用令牌（可选，启用即必填）。

## 资源（assets）

### 创建资源
POST `/v2/assets`

Request
```json
{
  "id": "a1",
  "creator_user_id": "u1",
  "name": "Asset Name",
  "asset_type": "text",
  "primary_content": { "text": "hello" },
  "properties": {},
  "files": [],
  "media": "https://...",
  "thumbnail": "https://...",
  "keywords": "optional",
  "status": "draft",
  "extra": {},
  "tag_ids": ["t1", "t2"],
  "created_timestamp": 1735000000000,
  "updated_timestamp": 1735000000000
}
```

Response
```json
{ "code": "OK", "data": { "id": "a1" } }
```

说明：
- `name` / `asset_type` / `primary_content` 必填。
- `id` 不传会自动生成。

### 获取资源
GET `/v2/assets/{id}`

Response（示例）
```json
{
  "code": "OK",
  "data": {
    "id": "a1",
    "team_id": "team1",
    "creator_user_id": "u1",
    "name": "Asset Name",
    "asset_type": "text",
    "primary_content": { "text": "hello" },
    "properties": {},
    "files": [],
    "media": "https://...",
    "thumbnail": "https://...",
    "keywords": "optional",
    "status": "draft",
    "extra": {},
    "tag_ids": ["t1", "t2"],
    "created_timestamp": 1735000000000,
    "updated_timestamp": 1735000000000
  }
}
```

### 更新资源（含标签全量覆盖）
PATCH `/v2/assets/{id}` 或 PUT `/v2/assets/{id}`

Request
```json
{
  "name": "New Name",
  "asset_type": "image",
  "primary_content": { "type": "image", "value": "s3://..." },
  "properties": {},
  "files": [],
  "media": "https://...",
  "thumbnail": "https://...",
  "keywords": "new",
  "status": "published",
  "extra": {},
  "tag_ids": ["t1", "t3"]
}
```

Response
```json
{ "code": "OK", "data": { "ok": true } }
```

说明：
- `tag_ids` 出现即触发“全量覆盖”绑定。
- 未出现的字段不会更新。

### 删除资源（软删）
DELETE `/v2/assets/{id}`

Response
```json
{ "code": "OK", "data": { "ok": true } }
```

### 搜索资源
GET `/v2/assets/search?view_id=...&tags=t1,t2&limit=20&page_token=...`

Response
```json
{
  "code": "OK",
  "data": {
    "items": ["a2", "a1"],
    "next_page_token": "..."
  }
}
```

查询规则：
- view 绑定的 tag 组：组内 AND，子 view 之间 OR。
- 用户 `tags` 追加为 AND。
- view 无 tag 时，默认检索全部（仅 `team_id` 过滤）。
- 分页为 `search_after`，`page_token` 为不透明游标。

分页说明：
- `limit` 默认 20，最大 200。
- `page_token` 绑定 `app_id/team_id/tags`，更改条件会返回 `page_token mismatch`。

## 标签（tags）

### 创建标签
POST `/v2/tags`

Request
```json
{
  "id": "t1",
  "name": "Tag Name",
  "color": "#ffcc00",
  "extra": {},
  "created_timestamp": 1735000000000,
  "updated_timestamp": 1735000000000
}
```

Response
```json
{ "code": "OK", "data": { "id": "t1" } }
```

### 标签列表
GET `/v2/tags?keyword=abc&limit=50&page_token=...`

Response
```json
{
  "code": "OK",
  "data": {
    "items": [
      {
        "id": "t1",
        "team_id": "team1",
        "name": "Tag Name",
        "name_norm": "tag name",
        "color": "#ffcc00",
        "extra": {},
        "created_timestamp": 1735000000000,
        "updated_timestamp": 1735000000000
      }
    ],
    "next_page_token": "..."
  }
}
```

### 删除标签
DELETE `/v2/tags/{id}`

Response
```json
{ "code": "OK", "data": { "ok": true } }
```

## 视图（views）

### 创建视图
POST `/v2/views`

Request
```json
{
  "id": "v1",
  "name": "View A",
  "description": "desc",
  "icon_url": "https://...",
  "parent_id": "v0",
  "path": "/root/a",
  "level": 1,
  "sort": 10,
  "display_config": {},
  "created_timestamp": 1735000000000,
  "updated_timestamp": 1735000000000
}
```

Response
```json
{ "code": "OK", "data": { "id": "v1" } }
```

### 更新视图
PATCH `/v2/views/{id}` 或 PUT `/v2/views/{id}`

Request
```json
{
  "name": "New Name",
  "description": "desc",
  "icon_url": "https://...",
  "parent_id": "v0",
  "path": "/root/new",
  "level": 2,
  "sort": 20,
  "display_config": {}
}
```

Response
```json
{ "code": "OK", "data": { "ok": true } }
```

### 删除视图
DELETE `/v2/views/{id}`

Response
```json
{ "code": "OK", "data": { "ok": true } }
```

### 视图树（当前为扁平列表）
GET `/v2/views/tree`

Response
```json
{
  "code": "OK",
  "data": {
    "items": [
      {
        "id": "v1",
        "team_id": "team1",
        "name": "View A",
        "description": "",
        "icon_url": "",
        "parent_id": "",
        "path": "/root/a",
        "level": 1,
        "sort": 10,
        "display_config": {},
        "created_timestamp": 1735000000000,
        "updated_timestamp": 1735000000000
      }
    ]
  }
}
```

### 绑定视图标签（全量覆盖）
PUT `/v2/views/{id}/tags`

Request
```json
{ "tag_ids": ["t1", "t2"] }
```

Response
```json
{ "code": "OK", "data": { "ok": true } }
```

## 错误码与 HTTP 状态
- 400：`INVALID_ARGUMENT`
- 401：`UNAUTHORIZED`
- 404：`NOT_FOUND`
- 405：`METHOD_NOT_ALLOWED`
- 409：`CONFLICT`
- 500：`INTERNAL`
