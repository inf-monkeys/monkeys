# 测试与压测建议（V2）

## 目标
- 确认搜索语义（view 组 OR、组内 AND、用户 tag AND、无 tag 时全量）一致且可回归。
- 分页稳定（无重复/漏项，排序一致）。
- 多租户隔离（app_id 选择表/索引，team_id 强制过滤）。
- 索引最终一致（若启用 ES/Outbox）。

## 单元测试（Go）
- tag 规范化：trim/lowercase/去重（含空白、大小写、重复）。
- view 默认过滤构造：无 tag -> 全量；有 tag -> OR(AND) 组合正确。
- 用户追加 tag 叠加：默认过滤 AND userTags。
- page_token：生成/解析一致；被篡改时识别无效；tags_hash/app_id/team_id 不匹配时拒绝。
- 排序字段：created/updated + id 的稳定排序构造。

## 集成测试（需要可用的 PG/ES 环境）
- 资源 CRUD：创建/更新/删除（软删除）后搜索结果变化正确。
- tag 绑定：资源绑定多个 tag；同名 tag 不同 id 的区分。
- view 绑定：父 view + 子 view，验证 OR 逻辑生效。
- view 无 tag：直接检索全部（仅 team_id 过滤）。
- 多租户：不同 app_id 使用不同表；跨 app_id 不串数据。
- team 过滤：同一 app_id 不同 team_id 互不见。
- 分页：连续翻页不重复不跳页；page_token 失效时返回明确错误。
- ES 回表顺序：ES 返回 id 列表后回表保持顺序。

## 回归测试建议
- 旧表与旧接口不受影响（仅新增 *_v2 表与新路由）。
- 不迁移现有表结构，确保历史逻辑可用。

## 压测建议（可选）
- 指标建议：搜索 P95 < 200ms（仅参考，需结合数据量与硬件）。
- 场景 1：1~3 个 tag AND，page_token 翻页（10/50/200 RPS）。
- 场景 2：父 view + 多子 view（OR 组较多），用户 tag AND。
- 场景 3：热 tag（高基数）与冷 tag 对比，观察 ES filter 命中率。
- 分页一致性：持续写入期间翻页，anchor 策略避免重复。

## 工具与数据准备（建议）
- 使用轻量压测工具（如 vegeta/k6），参数化 tags/view/limit。
- 生成固定种子数据：可复现的 tag/asset/view 关系。
- 记录：ES 查询耗时、DB 回表耗时、总耗时、错误率。

## 可观测性建议
- 统计 search 耗时分布、ES 请求耗时、page_token 无效率。
- 若启用 outbox：监控积压量、重试次数、延迟。
