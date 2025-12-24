# Go API 接口草案（Data Management V2）

## 约定
- 内网服务，仅 NestJS 调用。
- app_id 用于选择表前缀与 ES 索引名。
- team_id 作为强制过滤条件。
- 权限由 NestJS 做，Go 不做权限校验。

## 请求头
- X-App-Id: 租户标识，用于选择表/索引
- X-Team-Id: 团队标识，所有查询必须带入过滤
- X-Internal-Token: 内部认证（共享密钥）

## 资源（assets）

### 创建资源
POST /v2/assets

Request
```json
{
  "name": "asset name",
  "asset_type": "image",
  "primary_content": { "type": "image", "value": "s3://..." },
  "properties": {},
  "files": [],
  "media": "https://...",
  "thumbnail": "https://...",
  "keywords": "optional",
  "status": "draft",
  "extra": {},
  "tag_ids": ["t1", "t2"]
}
```

Response
```json
{ "id": "a1" }
```

### 更新资源
PATCH /v2/assets/{id}

Request
```json
{
  "name": "new name",
  "properties": {},
  "files": [],
  "media": "https://...",
  "thumbnail": "https://...",
  "keywords": "...",
  "status": "published",
  "extra": {}
}
```

Response
```json
{ "ok": true }
```

### 删除资源（软删）
DELETE /v2/assets/{id}

Response
```json
{ "ok": true }
```

### 获取资源详情
GET /v2/assets/{id}

Response
```json
{
  "id": "a1",
  "name": "asset name",
  "asset_type": "image",
  "primary_content": { "type": "image", "value": "s3://..." },
  "properties": {},
  "files": [],
  "media": "https://...",
  "thumbnail": "https://...",
  "keywords": "...",
  "status": "draft",
  "extra": {},
  "tag_ids": ["t1", "t2"],
  "created_timestamp": 1735000000000,
  "updated_timestamp": 1735000000000
}
```

### 搜索资源
GET /v2/assets/search?view_id=...&tags=t1,t2&limit=20&page_token=...

规则
- view_id 对应 view 的默认 tag 组（AND 组）
- 选中父 view 时，子 view 的 tag 组之间 OR
- 用户追加 tags 为 AND
- 若选中 view 没有 tag，默认检索全部（仅 team_id 过滤）

Response
```json
{
  "items": [
    { "id": "a1", "name": "...", "tag_ids": ["t1"] }
  ],
  "next_page_token": "..."
}
```

## 标签（tags）

### 创建标签
POST /v2/tags

Request
```json
{
  "name": "Tag Name",
  "color": "#ffcc00",
  "extra": {}
}
```

Response
```json
{ "id": "t1" }
```

### 获取标签列表
GET /v2/tags?keyword=xxx&limit=50&page_token=...

Response
```json
{
  "items": [ { "id": "t1", "name": "Tag Name" } ],
  "next_page_token": "..."
}
```

### 删除标签
DELETE /v2/tags/{id}

Response
```json
{ "ok": true }
```

### 绑定资源标签（全量覆盖）
PUT /v2/assets/{id}/tags

Request
```json
{ "tag_ids": ["t1", "t2"] }
```

Response
```json
{ "ok": true }
```

## 视图（views）

### 创建视图
POST /v2/views

Request
```json
{
  "name": "View A",
  "parent_id": null,
  "sort": 0,
  "display_config": {}
}
```

Response
```json
{ "id": "v1" }
```

### 更新视图
PATCH /v2/views/{id}

Request
```json
{
  "name": "New Name",
  "sort": 1,
  "display_config": {}
}
```

Response
```json
{ "ok": true }
```

### 删除视图
DELETE /v2/views/{id}

Response
```json
{ "ok": true }
```

### 获取视图树
GET /v2/views/tree

Response
```json
{
  "items": [
    { "id": "v1", "name": "View A", "children": [] }
  ]
}
```

### 绑定视图标签（全量覆盖）
PUT /v2/views/{id}/tags

Request
```json
{ "tag_ids": ["t1", "t2"] }
```

Response
```json
{ "ok": true }
```

## page_token 说明
- 建议使用 HMAC 签名的无状态 token，包含 last_sort 与 anchor。
- 若不使用 HMAC，可使用服务端游标存储。

## 错误码建议
- 400: 参数错误
- 401: 内网鉴权失败
- 404: 资源不存在
- 409: 并发或唯一约束冲突
- 500: 服务端异常
