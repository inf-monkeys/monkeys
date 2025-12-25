# monkey-data 文档

## 简介
monkey-data 是数据管理 V2 的 Go 子模块，负责资源/标签/视图的 CRUD 与检索加速。
它不处理上传与权限校验，权限由 NestJS 负责。

## 目录
- `plan.md`：阶段计划与完成情况。
- `database-schema.md`：V2 表结构与索引说明（含 ES 索引结构）。
- `http-api.md`：HTTP 接口、请求/响应格式与分页规则。
- `migration-template-v2.ts`：TypeORM 迁移模板（创建 *_v2 表）。
