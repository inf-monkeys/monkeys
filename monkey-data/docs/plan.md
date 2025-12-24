# 计划

## 已完成
- [x] 确认 V2 规则（tag 平面、view 树、view 内 AND、子 view 组 OR、用户 tag AND）
- [x] 输出 V2 数据模型与搜索语义
- [x] 明确多租户策略（app_id 前缀 + team_id 过滤）
- [x] 新增 TypeORM migration 模板（创建 *_v2 表）
- [x] 输出 monkey-data Go API 接口草案（CRUD + 搜索）
- [x] 输出索引/Outbox 草案（如需 ES 同步）
- [x] NestJS 对接 Go 模块（如需）
- [x] 补充测试与压测建议

## 实现计划（详细）

### 阶段 0：决策与约束确认
- [x] 选定基础依赖：PG 驱动（pgxpool）与 OpenSearch 客户端（opensearch-go）
- [x] page_token 方案：HMAC-SHA256 + base64url；若未配置密钥则降级为明文 base64url
- [x] 是否启用 Outbox/Indexer（默认先实现搜索，Outbox 后置）

### 阶段 1：基础设施与公共组件
- [x] 配置加载与默认值（已有 config.go 的补全）
- [ ] 统一错误结构与响应模型（包含错误码与 message）
- [x] 表名/索引名构造器（app_id 前缀 + *_v2 后缀）
- [ ] 连接与健康检查（PG/OS 可选 /healthz）

### 阶段 2：PG Repo 实现
- [x] 资产 CRUD：创建、更新、软删除、按 id 读取
- [x] Tag CRUD：创建/列表/删除（同名允许，不做唯一）
- [x] 资源-Tag 关系：替换绑定（事务内先删后插）
- [x] View CRUD：创建/更新/删除
- [x] View 树查询：按 parent_id/path 读取子树
- [x] View 绑定 Tag：替换绑定（事务内先删后插）
- [x] View Tag 组查询：给定 view_id -> 子树 view 列表 -> 每个 view 的 tag_ids 组

### 阶段 3：Search 实现（OpenSearch）
- [x] 查询 DSL 构造：team_id filter + (view tag 组 OR) + 用户 tags AND
- [x] 稳定排序：updated_timestamp desc + asset_id desc
- [x] search_after 分页：page_token 编解码（含 last_sort_values 与 tags_hash）
- [x] 返回 asset_id 列表 + next_page_token

### 阶段 4：Service 层编排
- [x] 组合 view 默认过滤 + 用户 tag AND 的最终过滤
- [x] view 无 tag 时的“全量”策略（仅 team_id 过滤）
- [x] 入参校验（team_id/app_id 必填，limit 范围）

### 阶段 5：HTTP API 处理器完善
- [x] 完成 assets/tags/views 的 JSON 输入输出与错误处理
- [x] 搜索接口返回 items + next_page_token
- [x] Header 校验（X-App-Id / X-Team-Id / X-Internal-Token）

### 阶段 6：测试与回归
- [ ] 单测：tag 规范化、view 组组合、page_token 编解码
- [ ] 集成测试：多租户隔离、分页稳定性、view 语义正确性

### 阶段 7：可选 Outbox/Indexer
- [x] Outbox 写入与轮询处理
- [x] Bulk upsert、失败重试与幂等
